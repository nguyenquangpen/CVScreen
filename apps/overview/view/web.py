from django.shortcuts import render, redirect
from apps.overview.models import ProcessedCv
import logging
from django.conf import settings

logger = logging.getLogger("default")

def overview(request):
    cv_records_for_display = []

    if request.method == 'POST':
        if 'cv_file' in request.FILES:
            uploaded_file = request.FILES['cv_file']

            try:
                cv_instance = ProcessedCv(cv_file=uploaded_file, status="Uploaded")
                cv_instance.save()

                message.success(request, "File uploaded successfully.")
                return redirect('overview')
            except Exception as e:
                logger.error(f"Error saving uploaded file: {e}")

        else:
            message.error(request, "No file selected for upload.")

    try:
        all_cvs = ProcessedCv.objects.all().order_by('-upload_time')
        cv_records_for_display = [{
            'id': cv.id,
            'file_name': cv.filename,
            'email': cv.email if cv.email else "None",
            'upload_time': cv.upload_time,
            'status': cv.status,
            'file_url': cv.cv_file.url
        } for cv in all_cvs]
    except Exception as e:
        logger.error(f"Error retrieving CV records: {e}")

    context = {
        'cv_records': cv_records_for_display
    }
    return render(request, 'pages/overview_screen.html', context)

    # def view_cv_file(request, pk):
    #     cv_record = get_object_or_404(ProcessedCv, pk=pk)
    #     try:
    #         file_path = cv_record.cv_file.path
    #         if not os.path.exists(file_path):
    #             message.error(request, "File does not exist.")
    #             return redirect('overview')
    #         return FileResponse(open(file_path, 'rb'), content_type='application/pdf')
    #     except Http404 as e:
    #         messages.error(request, str(e))
    #         return redirect('overview')
    #     except Exception as e:
    #         logger.error(f"Error viewing CV file {cv_record.filename}: {e}", exc_info=True)
    #         messages.error(request, f"Could not view file: {e}")
    #         return redirect('overview')
    
    # def delete_cv_record(request, pk):
    #     pass

def jd_editor(request):
    content = request.session.get("jd_content", "")
    return render(request, 'pages/jd_editor.html', {
        'content': content,
        'TINYMCE_KEY': settings.TINYMCE_KEY,
    })

def jd_save(request):
    if request.method != "POST":
        return HttpResponseBadRequest("Invalid method")

    content = request.POST.get("content", "")
    # Lưu tạm vào session (LOCAL, mất khi hết session)
    request.session["jd_content"] = content

    # Trả JSON để hiện alert AJAX hoặc redirect tuỳ bạn
    return JsonResponse({"status": "success", "message": "Đã lưu nội dung Job Description (local session)."})