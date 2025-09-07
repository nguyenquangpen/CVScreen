from django.shortcuts import render


def detailed_profile_view(request):
    return render(request, "pages/detailed_profile.html")