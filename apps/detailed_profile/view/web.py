from django.shortcuts import render


def detailed_profile_view(request, result_id=None):
    context = {}
    return render(request, "pages/detailed_profile.html")
