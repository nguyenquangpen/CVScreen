from django.shortcuts import render


def resume_screen(request):
    context = {}
    return render(request, "pages/resume_screen.html", context)
