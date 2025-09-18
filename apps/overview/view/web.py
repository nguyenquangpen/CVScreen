from django.conf import settings
from django.shortcuts import render


def overview(request):
    return render(
        request,
        "pages/overview_screen.html",
        {
            "TINYMCE_KEY": settings.TINYMCE_KEY,
        },
    )


def jd_editor(request):
    content = request.session.get("jd_content", "")
    return render(
        request,
        "pages/jd_editor.html",
        {
            "content": content,
            "TINYMCE_KEY": settings.TINYMCE_KEY,
        },
    )
