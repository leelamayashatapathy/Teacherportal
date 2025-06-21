let token = ''

function showAlert(message, type = 'success') {
  const alertBox = document.getElementById('alertBox')
  const alert = document.createElement('div')
  alert.className = `alert alert-${type} alert-dismissible fade show shadow`;
  alert.role = 'alert';
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  alertBox.appendChild(alert)
  setTimeout(() => {
    const bsAlert = bootstrap.Alert.getOrCreateInstance(alert)
    bsAlert.close()
  }, 1500)
}

function login() {
  fetch('/api/login/', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      username: document.getElementById('username').value,
      password: document.getElementById('password').value
    })
  }).then(res => res.json()).then(data => {
    if (data.access) {
      token = data.access
      localStorage.setItem('access', token)
      localStorage.setItem('message', 'Logged in successfully!')
      localStorage.setItem('type', 'success')
      window.location.href = '/api/dashboard/'
    } else {
      showAlert('Invalid credentials', 'danger')
    }
  })
}

function register() {
  fetch('/api/register/', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      username: document.getElementById('regUsername').value,
      password: document.getElementById('regPassword').value
    })
  }).then(res => res.json()).then(data => {
    if (data.success) {
      localStorage.setItem('message', 'Registered successfully. Please login.')
      localStorage.setItem('type', 'success')
      window.location.href = '/'
    } else {
      showAlert(data.error || "Registration failed", 'danger')
    }
  })
}


function loadStudents(url = '/api/students/') {
  fetch(url, {
    headers: { Authorization: 'Bearer ' + token }
  }).then(res => {
    if (res.status === 401) {
      logout(); return;
    }
    return res.json()
  }).then(data => {
    if (!data || !data.results) return;

    let html = '';
    data.results.forEach(stu => {
      html += `<tr><td>${stu.name}</td><td>${stu.subject}</td><td>${stu.mark}</td>
        <td>
          <button class='btn btn-sm btn-secondary' onclick='editStudent(${JSON.stringify(stu)})'><i class="bi bi-pencil-square"></i></button>
          <button class='btn btn-sm btn-danger' onclick='deleteStudent(${stu.id})'><i class="bi bi-trash"></i></button>
        </td></tr>`;
    });
    document.getElementById('studentTable').innerHTML = html;

    let paginationHtml = '';
    if (data.previous) {
      paginationHtml += `<button class="btn btn-outline-dark btn-sm me-2" onclick="loadStudents('${data.previous}')">Previous</button>`;
    }
    if (data.next) {
      paginationHtml += `<button class="btn btn-outline-dark btn-sm" onclick="loadStudents('${data.next}')">Next</button>`;
    }
    document.getElementById('paginationControls').innerHTML = paginationHtml;
  });
}


function saveStudent() {
  const data = {
    name: document.getElementById('sname').value,
    subject: document.getElementById('ssubject').value,
    mark: document.getElementById('smark').value
  }
  const id = document.getElementById('sid').value
  const closeModal = () => bootstrap.Modal.getInstance(document.getElementById('studentModal')).hide()
  const resetForm = () => {
    document.getElementById('sname').value = ''
    document.getElementById('ssubject').value = ''
    document.getElementById('smark').value = ''
    document.getElementById('sid').value = ''
  }
  const method = id ? 'PUT' : 'POST';
  if (id) data['id'] = id;

  fetch('/api/students/', {
    method: method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(data)
  }).then(() => {
    loadStudents();
    resetForm();
    closeModal();
    showAlert(id ? 'Student updated successfully' : 'Student added successfully', 'success')
  })
}

function editStudent(stu) {
  document.getElementById('sname').value = stu.name
  document.getElementById('ssubject').value = stu.subject
  document.getElementById('smark').value = stu.mark
  document.getElementById('sid').value = stu.id
  new bootstrap.Modal(document.getElementById('studentModal')).show()
}

function showAddModal() {
  document.getElementById('sname').value = ''
  document.getElementById('ssubject').value = ''
  document.getElementById('smark').value = ''
  document.getElementById('sid').value = ''
  new bootstrap.Modal(document.getElementById('studentModal')).show()
}

function deleteStudent(id) {
  fetch('/api/students/', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ id })
  }).then(() => {
    loadStudents();
    showAlert('Student deleted successfully', 'success')
  })
}

function logout() {
  token = ''
  localStorage.removeItem('access')
  localStorage.setItem('message', 'Logged out successfully.')
  localStorage.setItem('type', 'info')
  window.location.href = '/'
}

window.onload = () => {
  const storedToken = localStorage.getItem('access')
  const message = localStorage.getItem('message')
  const type = localStorage.getItem('type')
  if (message) {
    showAlert(message, type)
    localStorage.removeItem('message')
    localStorage.removeItem('type')
  }
  const isDashboard = window.location.pathname === '/api/dashboard/'
  if (storedToken && isDashboard) {
    token = storedToken
    loadStudents()
  }
}