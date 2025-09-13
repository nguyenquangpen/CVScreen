
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

    // Save using AJAX (local session)
    document.getElementById('btn-save').addEventListener('click', async () => {
      const content = tinymce.get('jd-editor').getContent();

      try {
        const resp = await fetch("{% url 'overview' %}", {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': '{{ csrf_token }}'
          },
          body: new URLSearchParams({ content })
        });

        if (!resp.ok) throw new Error('Server error ' + resp.status);
        const data = await resp.json();
        if (data.status === 'success') {
          showAlert('success', data.message || 'saved successfully.');
        } else {
          showAlert('warning', data.message || 'save failed.');
        }
      } catch (e) {
        showAlert('danger', e.message || 'error occurred while saving.');
      }
    });
  });