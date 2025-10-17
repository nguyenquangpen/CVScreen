from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.overview.models import MatchResult, MatchSession


class ResumeView(viewsets.ViewSet):

    def list(self, request):
        try:
            all_results_queryset = MatchResult.objects.all().order_by(
                "-session__created_at", "-match_score"
            )

            if not all_results_queryset.exists():
                return Response([], status=status.HTTP_200_OK)

            data_to_return = []
            for result in all_results_queryset:
                candidate_info = result.candidate_info or {}
                degrees = candidate_info.get("degrees", [])
                first_degree = degrees[0] if degrees else "Chưa có thông tin"

                data_to_return.append(
                    {
                        "id": result.id,
                        "resume_name": result.resume_filename,
                        "degree": first_degree,
                        "phone_number": "N/A",
                        "email": "N/A",
                        "score": result.match_score,
                    }
                )
            return Response(data_to_return, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Error fetching all match results: {e}")
            return Response(
                {"error": "Đã xảy ra lỗi hệ thống khi lấy dữ liệu."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["delete"], url_path="delete")
    def delete_result(self, request, pk=None):
        try:
            result_to_delete = MatchResult.objects.get(pk=pk)

            result_to_delete.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except MatchResult.DoesNotExist:
            return Response(
                {"error": "Kết quả không tồn tại."}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Lỗi server: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
