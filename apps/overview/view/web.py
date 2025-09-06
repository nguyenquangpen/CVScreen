from django.shortcuts import render

def overview(request):
    return render(request, "pages/overview_screen.html")
