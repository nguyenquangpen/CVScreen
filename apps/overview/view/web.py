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
            "jd_id": editing_jd_id,
            "TINYMCE_KEY": settings.TINYMCE_KEY,
        },
    )


def match_results_view(request, session_id):
    try:
        session = MatchSession.objects.get(pk=session_id)
        results = session.results.all().order_by("-match_score")

        context = {
            "session": session,
            "results": results,
        }
        return render(request, "pages/resume_screen.html", context)
    except MatchSession.DoesNotExist:
        raise Http404("Matching session not found.")
