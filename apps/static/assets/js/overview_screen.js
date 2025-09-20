$(function () {
  // ================== Config theo từng loại ==================
  const KINDS = {
    resumes: {
      btn: '#btn-upload-resume',
      tbody: '#resumeTableBody',
      accept: '.pdf,.doc,.docx,.txt',
      empty: '<tr><td colspan="6" class="text-center">Chưa có CV nào.</td></tr>',
      store: [],
      endpoint: '/api/resumes/',
      rowHtml: (r, toLocalTime) => `
        <tr class="normal_text" data-kind="resumes" data-id="${r.id}">
          <td class="text-center">
            <div class="form-check d-flex justify-content-center">
              <input class="form-check-input row-checkbox" type="checkbox" style="transform: scale(1.3); cursor: pointer;">
            </div>
          </td>
          <td class="fw-medium">${r.fileName}</td>
          <td class="text-center">${r.phone ?? '—'}</td>
          <td class="text-center">${toLocalTime(r.uploadTs)}</td>
          <td><span class="badge ${r.status === 'uploaded' ? 'bg-success' : 'bg-warning'}">${r.status || 'pending'}</span></td>
          <td class="text-center d-flex justify-content-center small_button">
            <button class="btn btn-sm btn-outline-success me-1 small_button" style="background-color: #16c09879">View</button>
            <button class="btn btn-sm btn-outline-danger small_button btn-delete" style="background-color: #FFC5C5">Delete</button>
          </td>
        </tr>
      `
    },
    jobdescriptions: {
      btn: '#btn-upload-job',
      tbody: '#jdTableBody',
      accept: '.pdf,.doc,.docx,.txt',
      empty: '<tr><td colspan="5" class="text-center">Chưa có JD nào.</td></tr>',
      store: [],
      endpoint: '/api/jobdescriptions/',
      rowHtml: (r, toLocalTime) => `
        <tr class="normal_text" data-kind="jobdescriptions" data-id="${r.id}">
          <td class="text-center">
            <div class="form-check d-flex justify-content-center">
              <input class="form-check-input row-checkbox" type="checkbox" style="transform: scale(1.3); cursor: pointer;">
            </div>
          </td>
          <td class="fw-medium">${r.fileName}</td>
          <td class="text-center">${toLocalTime(r.uploadTs)}</td>
          <td class="text-center">
            <div class="d-flex justify-content-center align-items-center small_button">
              <button class="btn btn-sm btn-outline-success me-1 small_button" style="background-color: #16c09879">View</button>
              <button class="btn btn-sm btn-outline-danger small_button btn-delete" style="background-color: #FFC5C5">Delete</button>
            </div>
          </td>
        </tr>
      `
    }
  };

  // ================== DOM & CSRF ==================
  const $msg = $('#messageContainer');

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  }
  const csrftoken = getCookie('csrftoken');

  // ================== Helpers chung ==================
  function showMsg(type, message) {
    const html = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
    $msg.append(html);
    setTimeout(() => $msg.find('.alert').first().alert('close'), 3000);
  }

  function toLocalTime(ts) {
    const d = new Date(ts);
    return isNaN(d) ? new Date().toLocaleString() : d.toLocaleString();
  }

  // ================== API chung (Tool Server) ==================
  function apiUpload(kind, file) {
    const fd = new FormData();
    fd.append('file', file);
    return fetch(`${KINDS[kind].endpoint}upload/`, {
      method: 'POST',
      body: fd,
      headers: {
        'X-CSRFToken': csrftoken
      },
      credentials: 'same-origin'
    }).then(async r => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.detail || data.error || `Upload failed (${r.status})`);
      return data;
    });
  }

  function apiDelete(kind, id) {
    return fetch(`${KINDS[kind].endpoint}${id}/delete/`, {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': csrftoken
      },
      credentials: 'same-origin'
    }).then(r => {
      if (!r.ok) throw new Error(`Delete failed (${r.status})`);
    });
  }

  function apiFetchList(kind) {
    return fetch(KINDS[kind].endpoint, {
      method: 'GET',
      credentials: 'same-origin'
    }).then(async r => {
      if (!r.ok) throw new Error(`Failed to fetch ${kind} list (${r.status})`);
      return r.json();
    });
  }

  function sendDataToAI(resumeIds, jdId) {
    const payload = {
      resume_ids: resumeIds,
      job_ids: jdId
    };
    const DJANGO_AI_PROCESS_ENDPOINT = '/api/process-with-ai/';

    return fetch(DJANGO_AI_PROCESS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
      body: JSON.stringify(payload),
      credentials: 'same-origin'
    }).then(async r => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(data.detail || data.error || `Failed to send data to Django backend for AI processing (${r.status})`);
      }
      return data;
    });
  }

  function normalize(kind, data) {
    const base = {
      id: data.id.toString(),
      fileName: data.filename,
      uploadTs: Date.parse(data.upload_time) || Date.now(),
      status: data.status || 'pending'
    };
    return kind === 'resumes' ? { ...base,
      email: data.email || '',
    } : base;
  }

  // ================== Render chung ==================
  function render(kind) {
    const cfg = KINDS[kind];
    const $tbody = $(cfg.tbody);
    const list = cfg.store;

    if (!list.length) {
      $tbody.html(cfg.empty);
      return;
    }

    const rows = list
      .slice()
      .sort((a, b) => (b.uploadTs || 0) - (a.uploadTs || 0))
      .map(item => cfg.rowHtml(item, toLocalTime))
      .join('');

    $tbody.html(rows);
    updateSelectAllCheckbox(kind);
  }

  // ================== Hidden input theo từng loại ==================
  function makeHiddenInput(kind) {
    const cfg = KINDS[kind];
    const input = $('<input>', {
      type: 'file',
      multiple: true,
      accept: cfg.accept,
      style: 'display:none;'
    }).appendTo(document.body);

    input.on('change', (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return showMsg('warning', 'No files selected.');

      Promise.all(files.map(file => apiUpload(kind, file)))
        .then(uploadedDataArray => {
          uploadedDataArray.forEach(data => {
            if (data) {
              cfg.store.push(normalize(kind, data));
              showMsg('success', `Uploaded ${kind === 'resumes' ? 'resume' : 'JD'}: ${data.filename}`);
            }
          });
          render(kind);
        })
        .catch(err => showMsg('danger', `Batch upload ${kind === 'resumes' ? 'resume' : 'JD'} error: ${err.message}`))
        .finally(() => {
          input.val('');
        });
    });

    return input;
  }

  // ================== Bind cho từng loại (nút upload + delete delegation) ==================
function bind(kind) {
  const cfg = KINDS[kind];
  const hiddenInput = makeHiddenInput(kind);

  $(cfg.btn).on('click', () => hiddenInput.click());

  $(cfg.tbody).on('click', '.btn-delete', function () {
    const $row = $(this).closest('tr');
    const id = $row.data('id');
    const itemFileName = $row.find('td.fw-medium').text();
    Swal.fire({
      title: 'Xác nhận xóa',
      text: `Bạn có chắc chắn muốn xóa "${itemFileName}"? Hành động này không thể hoàn tác.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Có, xóa!',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        apiDelete(kind, id)
          .then(() => {
            const i = cfg.store.findIndex(r => r.id === id);
            if (i >= 0) cfg.store.splice(i, 1);
            render(kind);
            Swal.fire(
              'Đã xóa!',
              `Mục "${itemFileName}" đã được xóa thành công.`,
              'success'
            );
          })
          .catch(err => {
            showMsg('danger', `Delete error: ${err.message}`);
            Swal.fire(
              'Lỗi!',
              `Không thể xóa "${itemFileName}". Lỗi: ${err.message}`,
              'error'
            );
          });
      }
    });
  });

  $(cfg.tbody).on('change', '.row-checkbox', function () {
    const $thisCheckbox = $(this);
    const isChecked = $thisCheckbox.prop('checked');

    if (kind === 'jobdescriptions') {
      if (isChecked) {
        $(`${cfg.tbody} .row-checkbox`).not($thisCheckbox).prop('checked', false);
      }
    } else {
      updateSelectAllCheckbox(kind);
    }
  });
}

  // ================== Logic Checkbox "Select All" ==================
  function setupSelectAllCheckbox(tableBodyId) {
    const $tableBody = $(tableBodyId);
    const $selectAllCheckbox = $tableBody.closest('table').find('thead .select-all');

    $selectAllCheckbox.on('change', function () {
      const isChecked = $(this).prop('checked');
      $tableBody.find('.row-checkbox').prop('checked', isChecked);
    });

    $tableBody.on('change', '.row-checkbox', function () {
      updateSelectAllCheckbox(tableBodyId === '#jdTableBody' ? 'jobdescriptions' : 'resumes');
    });
  }

  function updateSelectAllCheckbox(kind) {
    const cfg = KINDS[kind];
    const $tbody = $(cfg.tbody);
    const $selectAllCheckbox = $tbody.closest('table').find('thead .select-all');
    const $rowCheckboxes = $tbody.find('.row-checkbox');

    if ($rowCheckboxes.length === 0) {
      $selectAllCheckbox.prop('checked', false).prop('disabled', true);
    } else {
      const allChecked = $rowCheckboxes.length > 0 && $rowCheckboxes.filter(':checked').length === $rowCheckboxes.length;
      $selectAllCheckbox.prop('checked', allChecked).prop('disabled', false);
    }
  }

  // ================== Xử lý sự kiện nút "Bắt đầu" ==================
  $('#btn-start').on('click', function () {
    const $startButton = $(this);
    $startButton.prop('disabled', true);

    const selectedResumeIds = [];
    $('#resumeTableBody .row-checkbox:checked').each(function () {
      const rowId = $(this).closest('tr').data('id');
      if (rowId) {
        selectedResumeIds.push(rowId.toString());
      }
    });

    const selectedJdIds = [];
    $('#jdTableBody .row-checkbox:checked').each(function () {
      const rowId = $(this).closest('tr').data('id');
      if (rowId) {
        selectedJdIds.push(rowId.toString());
      }
    });

    if (selectedResumeIds.length === 0 || selectedJdIds.length === 0 || selectedJdIds.length > 1) {
      showMsg('warning', 'Vui lòng chọn ít nhất một CV VÀ một JD để bắt đầu khớp.');
      $startButton.prop('disabled', false);
      return;
    }

    sendDataToAI(selectedResumeIds, selectedJdIds)
      .then(response => {
        showMsg('success', 'Yêu cầu xử lý AI đã được gửi thành công! Kết quả sẽ được hiển thị.');
        console.log('Django Backend Response (from AI Server):', response);
        alert('AI processing request sent successfully! Check console for response.');
      })
      .catch(error => {
        showMsg('danger', `Gửi yêu cầu xử lý AI thất bại: ${error.message}`);
        console.error('Error sending data to Django Backend for AI:', error);
      })
      .finally(() => {
            $startButton.prop('disabled', false);
      });
  });

  // ================== Khởi tạo ==================
  async function initializeData() {
    try {
      const resumesData = await apiFetchList('resumes');
      KINDS.resumes.store = resumesData.map(d => normalize('resumes', d));
      render('resumes');
      showMsg('info', 'Resumes loaded from server.');
    } catch (error) {
      console.error("Error loading resumes:", error);
      showMsg('danger', 'Failed to load resumes from server.');
    }

    try {
      const jdsData = await apiFetchList('jobdescriptions');
      KINDS.jobdescriptions.store = jdsData.map(d => normalize('jobdescriptions', d));
      render('jobdescriptions');
      showMsg('info', 'Job descriptions loaded from server.');
    } catch (error) {
      console.error("Error loading job descriptions:", error);
      showMsg('danger', 'Failed to load job descriptions from server.');
    }
  }

  // --- Chạy các hàm thiết lập ban đầu ---
  bind('resumes');
  bind('jobdescriptions');
  setupSelectAllCheckbox('#resumeTableBody');
  initializeData();
});
