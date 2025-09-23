
document.addEventListener('DOMContentLoaded', () => {
    // Initialize TinyMCE
    tinymce.init({
      selector: '#jd-editor',
      height: 520,
      menubar: true,
      plugins: 'lists link table code fullscreen',
      toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | link table | alignleft aligncenter alignright | fullscreen | code',
      branding: false
    });

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

    // Save using AJAX (local session)
    document.getElementById('btn-save').addEventListener('click', async () => {
      const content = tinymce.get('jd-editor').getContent();
      const jdId = document.getElementById('editing-jd-id').value; // Get the JD ID from the hidden input

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
        showAlert('danger', e.message || errorMessage);
      }
    });
  });