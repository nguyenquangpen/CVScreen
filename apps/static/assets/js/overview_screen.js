$(function () {
  const KINDS = {
    resumes: {
      btn: '#btn-upload-resume',
      tbody: '#resumeTableBody',
      accept: '.pdf,.doc,.docx,.txt',
      empty: '<tr><td colspan="6" class="text-center">Chưa có CV nào.</td></tr>',
      store: [],
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
            <a href="${r.url}" target="_blank" class="btn btn-sm btn-outline-success me-1 small_button" style="background-color: #16c09879">View</a>
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
              <a href="${r.url}" target="_blank" class="btn btn-sm btn-outline-success me-1 small_button" style="background-color: #16c09879">View</a>
              <button class="btn btn-sm btn-outline-danger small_button btn-delete" style="background-color: #FFC5C5">Delete</button>
            </div>
          </td>
        </tr>
      `
    }
  };

  const $msg = $('#messageContainer');
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  }
  const csrftoken = getCookie('csrftoken');

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

  function apiUpload(kind, file) {
    const fd = new FormData();
    fd.append('file', file);
    return fetch(`/api/${kind}/`, {
      method: 'POST',
      body: fd,
      headers: { 'X-CSRFToken': csrftoken },
      credentials: 'same-origin'
    }).then(async r => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.detail || data.error || `Upload failed (${r.status})`);
      return data; 
    });
  }
  
  function apiDelete(kind, id) {
    return fetch(`/api/${kind}/${id}/`, {
      method: 'DELETE',
      headers: { 'X-CSRFToken': csrftoken },
      credentials: 'same-origin'
    }).then(r => {
      if (!r.ok) throw new Error(`Delete failed (${r.status})`);
    });
  }

  function normalize(kind, data) {
    const base = {
      id: data.id,
      fileName: data.filename,
      url: data.download_url,
      uploadTs: Date.parse(data.upload_time) || Date.now(),
      status: 'uploaded'
    };
    return kind === 'resumes' ? { ...base, phone: null, email: null } : base;
  }

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
  }

  function makeHiddenInput(kind) {
    const cfg = KINDS[kind];
    const input = $('<input>', { type: 'file', multiple: true, accept: cfg.accept, style: 'display:none;' })
      .appendTo(document.body);

    input.on('change', (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return showMsg('warning', 'No files selected.');
      files.forEach(file => {
        apiUpload(kind, file)
          .then(data => {
            cfg.store.push(normalize(kind, data));
            render(kind);
            showMsg('success', `Uploaded ${kind === 'resumes' ? 'resume' : 'JD'}: ${data.filename}`);
          })
          .catch(err => showMsg('danger', `Upload ${kind === 'resumes' ? 'resume' : 'JD'} error: ${err.message}`));
      });
      input.val('');
    });
    return input;
  }

  function bind(kind) {
    const cfg = KINDS[kind];
    const hiddenInput = makeHiddenInput(kind);

    $(cfg.btn).on('click', () => hiddenInput.click());

    $(cfg.tbody).on('click', '.btn-delete', function () {
      const $row = $(this).closest('tr');
      const id = $row.data('id');
      const name = $row.find('td.fw-medium').text().trim() || (kind === 'resumes' ? 'resume' : 'JD');

      Swal.fire({
        title: `Xóa ${name}?`,
        text: "Hành động này không thể hoàn tác!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy"
      }).then((result) => {
        if (result.isConfirmed) {
          apiDelete(kind, id)
            .then(() => {
              const i = cfg.store.findIndex(r => r.id === id);
              if (i >= 0) cfg.store.splice(i, 1);
              render(kind);
              Swal.fire("Đã xóa!", `${name} đã được xóa.`, "success");
            })
            .catch(err => Swal.fire("Lỗi!", `Không thể xóa: ${err.message}`, "error"));
        }
      });
    });
  }

  // ================== Khởi tạo ==================
  bind('resumes');
  bind('jobdescriptions');
  render('resumes');
  render('jobdescriptions');

  // ==== Load dataset từ server khi refresh ====
  Promise.all([
    fetch('/api/resumes/', { credentials: 'same-origin' }).then(r => r.json()),
    fetch('/api/jobdescriptions/', { credentials: 'same-origin' }).then(r => r.json()),
  ]).then(([resumes, jds]) => {
    KINDS.resumes.store = (resumes || []).map(d => normalize('resumes', d));
    KINDS.jobdescriptions.store = (jds || []).map(d => normalize('jobdescriptions', d));
    render('resumes');
    render('jobdescriptions');
  }).catch(err => {
    showMsg('danger', `Load dữ liệu lỗi: ${err.message || err}`);
  });

  async function fetchAllPages(url) {
  const out = [];
  let next = url;
  while (next) {
    const r = await fetch(next, { credentials: 'same-origin' });
    if (!r.ok) throw new Error(`Fetch failed (${r.status})`);
    const data = await r.json();
    if (Array.isArray(data)) { 
      out.push(...data);
      break;
    } else { 
      out.push(...(data.results || []));
      next = data.next;
    }
  }
  return out;
}

// ==== Load dataset từ server khi refresh (hỗ trợ phân trang) ====
  (async () => {
    try {
      const [resumes, jds] = await Promise.all([
        fetchAllPages('/api/resumes/'),
        fetchAllPages('/api/jobdescriptions/'),
      ]);
      KINDS.resumes.store = resumes.map(d => normalize('resumes', d));
      KINDS.jobdescriptions.store = jds.map(d => normalize('jobdescriptions', d));
      render('resumes');
      render('jobdescriptions');
    } catch (err) {
      showMsg('danger', `Load dữ liệu lỗi: ${err.message || err}`);
    }
  })();

});
