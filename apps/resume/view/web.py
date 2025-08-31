from django.shortcuts import render

def resume_screen(request):
    return render(request, 'pages/resume_screen.html')