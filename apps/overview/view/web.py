from django.conf import settings
from django.shortcuts import render, get_object_or_404
from apps.overview.models import JobDescription
from apps.overview.view.api import _extract_text_from_bytes 

def overview(request):
    return render(
        request,
        "pages/overview_screen.html",
        {
            "TINYMCE_KEY": settings.TINYMCE_KEY,
        },
    )

def jd_editor(request, jd_id=None):
    editor_content = ""
    editing_jd_id = None

    if jd_id: 
        job_description = get_object_or_404(JobDescription, pk=jd_id)
        editing_jd_id = jd_id
        if job_description.file_content:
            try:
                file_content_for_processing = bytes(job_description.file_content)

                if job_description.mime_type == 'text/html' or 'html' in job_description.filename:
                    editor_content = file_content_for_processing.decode('utf-8')
                else:
                    editor_content = _extract_text_from_bytes(file_content_for_processing, job_description.mime_type)

                if not editor_content and job_description.file_content:
                        editor_content = "[The original file content cannot be displayed directly. Please edit it to create HTML content..]"
            
            except UnicodeDecodeError:
                editor_content = "[Undecodeable content component text display]"
                logger.warning(f"Could not decode file_content for JD {jd_id}. It might not be plain text.")
        else:
            editor_content = "" 
    
    return render(
        request,
        "pages/jd_editor.html",
        {
            "content": editor_content, 
            "jd_id": editing_jd_id,   
            "TINYMCE_KEY": settings.TINYMCE_KEY,
        },
    )