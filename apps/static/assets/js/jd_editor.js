document.addEventListener('DOMContentLoaded', () => {
    // Quick alert function
    function showAlert(type, msg) {
      const box = document.createElement('div');
      box.className = `alert alert-${type} alert-dismissible fade show`;
      box.role = 'alert';
      box.innerHTML = `${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
      document.getElementById('alert-container').appendChild(box);
      setTimeout(() => box.remove(), 3500);
    }

    // Helper to get CSRF token
    function getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    }
    const csrftoken = getCookie('csrftoken');

    const btnGenJd = document.getElementById('btn-gen-jd');
    let tinymceEditor;

    function updateGenJdButtonState() {
        if (tinymceEditor) {
            const content = tinymceEditor.getContent({ format: 'text' }).trim();
            btnGenJd.disabled = content.length === 0;
        } else {
            btnGenJd.disabled = true;
        }
    }

    // Initialize TinyMCE
    tinymce.init({
      selector: '#jd-editor',
      height: 520,
      menubar: true,
      plugins: 'lists link table code fullscreen',
      toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | link table | alignleft aligncenter alignright | fullscreen | code',
      branding: false,
      setup: function(editor) {
        tinymceEditor = editor;
        editor.on('init', updateGenJdButtonState);
        editor.on('change', updateGenJdButtonState);
        editor.on('keyup', updateGenJdButtonState);
      }
    });

    document.getElementById('btn-save').addEventListener('click', async () => {
      const content = tinymceEditor.getContent();
      const jdId = document.getElementById('editing-jd-id').value;

      let endpoint;
      let method;
      let successMessage;
      let errorMessage;

      if (jdId) {
        endpoint = `/api/jobdescriptions/${jdId}/`;
        method = 'PATCH';
        successMessage = 'Job description updated successfully.';
        errorMessage = 'An error occurred while updating the job description.';
      } else {
        endpoint = `/api/jobdescriptions/`;
        method = 'POST';
        successMessage = 'New job description created successfully.';
        errorMessage = 'An error occurred while creating the new job description.';
      }

      try {
        const resp = await fetch(endpoint, {
          method: method,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          body: JSON.stringify({ content: content })
        });

        if (!resp.ok) {
            const errorData = await resp.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.error || `Server error ${resp.status}`);
        }

        const data = await resp.json();
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: successMessage,
          showConfirmButton: true
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = '/overview/';
          }
        })

        if (method === 'POST' && data.id) {
            document.getElementById('editing-jd-id').value = data.id;
            history.pushState({ jd_id: data.id }, '', `/jd-editor/${data.id}/`);
        }

      } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: e.message || errorMessage,
            confirmButtonText: 'OK'
        });
      }
    });

    // Generate JD using LLM
    btnGenJd.addEventListener('click', async () => {
        const currentContent = tinymceEditor.getContent();
        if (!currentContent.trim()) {
            showAlert('warning', 'Please enter content to generate JD.');
            return;
        }

        btnGenJd.disabled = true;

        Swal.fire({
            title: 'Generating Job Description...',
            html: 'Please wait while AI processes your request.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await fetch('/api/generate-jd-from-llm/', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify({ prompt_content: currentContent })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.error || `Failed to generate JD using AI (${response.status})`);
            }

            const data = await response.json();
            const generatedJd = data.generated_jd;
            if (generatedJd) {
                tinymceEditor.setContent(generatedJd);
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'JD generated successfully using AI.',
                    confirmButtonText: 'OK'
                });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'No Content',
                    text: 'AI did not return any content.',
                    confirmButtonText: 'OK'
                });
            }
            // Kết thúc phần mới

        } catch (e) {
            console.error('Failed to generate JD using AI:', e);
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: `Failed to generate JD using AI: ${e.message}`,
                confirmButtonText: 'OK'
            });
        } finally {
            Swal.close();
            updateGenJdButtonState();
        }
    });
  });
