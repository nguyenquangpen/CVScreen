# apps/overview/view/api.py

import requests
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from apps.overview.models import MatchSession, MatchResult
import json

from django.urls import reverse

# QUAN TRỌNG: Import các model của bạn
from ..models import MatchSession, MatchResult

SERVER_BASE_URL = settings.AI_URL


def _proxy_request_to_main_server(endpoint, request_method, request_data=None, request_files=None):
    url = f"{SERVER_BASE_URL}{endpoint}"
    headers = {}
    
    try:
        if request_data:
            headers['Content-Type'] = 'application/json'
        
        response = requests.request(
            method=request_method,
            url=url,
            json=request_data,
            files=request_files,
            headers=headers,
            timeout=30
        )
        response.raise_for_status()
        
        try:
            return Response(response.json(), status=response.status_code)
        except ValueError:
            return Response(response.text, status=response.status_code)
            
    except requests.exceptions.RequestException as e:
        return Response({"error": f"Lỗi giao tiếp với server chính: {e}"}, status=status.HTTP_502_BAD_GATEWAY)


# ================== ViewSet cho Resume ==================
class ResumeViewSet(viewsets.ViewSet):
    parser_classes = [MultiPartParser, FormParser] 

    #GET /api/resumes/
    def list(self, request):
        return _proxy_request_to_main_server('/api/resumes/', 'GET')

    #POST /api/resumes/upload/
    @action(detail=False, methods=['post'], url_path='upload')
    def upload_resume(self, request):
        if 'file' not in request.FILES:
            return Response({"error": "Không tìm thấy file."}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES['file']
        files_tuple = (uploaded_file.name, uploaded_file.read(), uploaded_file.content_type)
        files = {'file': files_tuple}

        return _proxy_request_to_main_server('/api/resumes/upload/', 'POST', request_files=files)

    #DELETE /api/resumes/<pk>/delete/
    @action(detail=True, methods=['delete'], url_path='delete')
    def delete_resume(self, request, pk=None):
        return _proxy_request_to_main_server(f'/api/resumes/{pk}/delete/', 'DELETE')


# ================== ViewSet cho Job Description ==================
class JobDescriptionViewSet(viewsets.ViewSet):
    parser_classes = [MultiPartParser, FormParser]

    #GET /api/jobdescriptions/
    def list(self, request):
        return _proxy_request_to_main_server('/api/jobdescriptions/', 'GET')

    # /api/jobdescriptions/upload/
    @action(detail=False, methods=['post'], url_path='upload')
    def upload_jd(self, request):
        if 'file' not in request.FILES:
            return Response({"error": "Không tìm thấy file."}, status=status.HTTP_400_BAD_REQUEST)
        
        uploaded_file = request.FILES['file']
        files_tuple = (uploaded_file.name, uploaded_file.read(), uploaded_file.content_type)
        files = {'file': files_tuple}

        return _proxy_request_to_main_server('/api/jobdescriptions/upload/', 'POST', request_files=files)

    # api/jobdescriptions/<pk>/delete/
    @action(detail=True, methods=['delete'], url_path='delete')
    def delete_jd(self, request, pk=None):
        return _proxy_request_to_main_server(f'/api/jobdescriptions/{pk}/delete/', 'DELETE')

class ProcessWithAI(APIView):
    def post(self, request):
        request_data = request.data
        match_results = []

        try:
            url = f"{SERVER_BASE_URL}/api/process-with-ai/"

            response = requests.post(url, json=request_data, timeout=120)

            raw_results = response.json()

            match_results = raw_results.get('results', [])

        except requests.exceptions.Timeout:
            return Response({"error": "Yêu cầu đến server AI bị timeout."}, status=status.HTTP_504_GATEWAY_TIMEOUT)
        except requests.exceptions.RequestException as e:
            return Response({"error": f"Lỗi giao tiếp với server AI: {e}"}, status=status.HTTP_502_BAD_GATEWAY)
        except ValueError: 
             return Response({"error": "Server AI trả về dữ liệu không hợp lệ."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            jd_id = request_data.get('job_description_id')

            if not jd_id:
                return Response({"error": f"'{jd_id}' - {request_data} is missing from the request body."}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                session = MatchSession.objects.create(
                    job_description_id=jd_id,
                    job_description_filename=f"Job Description ID {jd_id}"
                )

                for result_item in match_results:
                    MatchResult.objects.create(
                        session=session,
                        resume_id=result_item.get('resume_id'),
                        job_id=jd_id,
                        resume_filename=result_item.get('filename'),
                        match_score=result_item.get('match_score'),
                        candidate_info=result_item.get('candidate_info', {}),
                        candidate_skills=result_item.get('candidate_skills', [])
                    )
            
            redirect_url = reverse('resume_screen')

            return Response({
                "status": "success",
                'message': 'Xử lý thành công. Đang chuyển hướng...',
                'redirect_url': redirect_url
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({"error": f"Lỗi hệ thống khi lưu dữ liệu: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)