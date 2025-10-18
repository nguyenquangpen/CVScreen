import logging

from rest_framework.generics import ListAPIView

from apps.overview.models import MatchResult

from ..serializers import MatchResultSerializer

logger = logging.getLogger(__name__)


class AllMatchResultsView(ListAPIView):
    """
    Cung cấp danh sách tất cả các kết quả khớp (MatchResult)
    đã được lưu trong cơ sở dữ liệu.
    """

    serializer_class = MatchResultSerializer

    def get_queryset(self):
        # In log ra terminal mỗi khi hàm này được gọi
        print("\n--- [LOG BACKEND] AllMatchResultsView: get_queryset được gọi! ---")

        queryset = MatchResult.objects.all().order_by("-match_score")

        # In ra số lượng kết quả tìm thấy
        print(
            f"--- [LOG BACKEND] Đã tìm thấy: {queryset.count()} kết quả trong database. ---"
        )

        if not queryset.exists():
            print(
                "--- [LOG BACKEND] CẢNH BÁO: Queryset rỗng! Không có dữ liệu để trả về. ---\n"
            )
        else:
            print(
                "--- [LOG BACKEND] Queryset có dữ liệu. Sẽ được gửi tới serializer. ---\n"
            )

        return queryset
