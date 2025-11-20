from django.conf import settings
from django.shortcuts import get_object_or_404, render


def overview(request):
    return render(
        request,
        "pages/overview_screen.html",
        {
            "TINYMCE_KEY": settings.TINYMCE_KEY,
        },
    )


def jd_editor(request, jd_id=None):
    editor_content = {"jd_id": jd_id}

    return render(
        request,
        "pages/jd_editor.html",
        {
            "content": editor_content,
            "jd_id": jd_id,
            "TINYMCE_KEY": settings.TINYMCE_KEY,
        },
    )