const API_BASE = '/api';

// State
let token = localStorage.getItem('token');
let userRole = localStorage.getItem('role');

// DOM Elements
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const userInfo = document.getElementById('userInfo');
const userRoleBadge = document.getElementById('userRoleBadge');
const alertContainer = document.getElementById('alertContainer');

const adminSection = document.getElementById('adminSection');
const lectorSection = document.getElementById('lectorSection');
const studentSection = document.getElementById('studentSection');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    if (token && userRole) {
        initSession();
    } else {
        handleLogout();
    }
});

// Helper: Show Alert
function showAlert(message, type = 'error') {
    const bg = type === 'error' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200';
    alertContainer.innerHTML = `
        <div class="p-4 rounded border ${bg} flex justify-between items-center shadow-sm">
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="font-bold ml-4 text-xl">&times;</button>
        </div>
    `;
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

// Helper: Authenticated Fetch
async function fetchAuth(url, options = {}) {
    if (!options.headers) options.headers = {};
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    options.headers['Content-Type'] = 'application/json';
    
    const response = await fetch(`${API_BASE}${url}`, options);
    
    if (response.status === 401 && !options.ignoreAuthErrors) {
        handleLogout();
        showAlert('Session expired. Please login again.');
    }
    return response;
}

// Helper: Decode JWT to check expiration
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// Init Session
function initSession() {
    const payload = parseJwt(token);
    if (!payload || payload.exp * 1000 < Date.now()) {
        handleLogout();
        return;
    }
    
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    userInfo.classList.remove('hidden');
    
    userRoleBadge.textContent = `Role: ${userRole}`;
    
    // Switch views
    adminSection.classList.add('hidden');
    lectorSection.classList.add('hidden');
    studentSection.classList.add('hidden');
    
    document.getElementById('courseActionHeader').classList.add('hidden');
    
    if (userRole === 'ADMIN') {
        adminSection.classList.remove('hidden');
        document.getElementById('courseActionHeader').classList.remove('hidden');
        populateLectorDropdowns();
    } else if (userRole === 'LECTOR') {
        lectorSection.classList.remove('hidden');
        populateStudentDropdown();
    } else if (userRole === 'STUDENT') {
        studentSection.classList.remove('hidden');
        document.getElementById('courseActionHeader').classList.remove('hidden');
        loadMyGrades();
        loadMyCourses();
    }
    
    loadAllCourses();
}

async function populateLectorDropdowns() {
    const res = await fetchAuth('/users?role=LECTOR');
    if (res.ok) {
        const lectors = await res.json();
        const courseLectorSelect = document.getElementById('courseLectorId');
        const modalLectorSelect = document.getElementById('newLectorId');
        
        let options = '<option value="">-- Unassigned --</option>';
        lectors.forEach(l => options += `<option value="${l.id}">${l.email}</option>`);
        courseLectorSelect.innerHTML = options;
        
        let modalOptions = '<option value="">-- Select Lector --</option>';
        lectors.forEach(l => modalOptions += `<option value="${l.id}">${l.email}</option>`);
        modalLectorSelect.innerHTML = modalOptions;
    }
}

async function populateStudentDropdown() {
    const res = await fetchAuth('/users?role=STUDENT');
    if (res.ok) {
        const students = await res.json();
        const studentSelect = document.getElementById('gradeStudentId');
        let options = '<option value="">-- Select Student --</option>';
        students.forEach(s => options += `<option value="${s.id}">${s.email}</option>`);
        studentSelect.innerHTML = options;
    }
}

// Logout
function handleLogout() {
    token = null;
    userRole = null;
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    loginView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    userInfo.classList.add('hidden');
}
document.getElementById('logoutBtn').addEventListener('click', handleLogout);

// Event Listeners

// Login Form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    if (res.ok) {
        const data = await res.json();
        token = data.token;
        userRole = data.role; // Now we get the exact role securely from the backend!
        
        localStorage.setItem('token', token);
        localStorage.setItem('role', userRole);
        
        document.getElementById('loginForm').reset();
        initSession();
        showAlert('Login successful!', 'success');
    } else {
        showAlert('Invalid email or password');
    }
});

// Admin: Register User
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;
    
    const res = await fetchAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, role })
    });
    
    if (res.ok) {
        showAlert(`User ${email} registered successfully!`, 'success');
        document.getElementById('registerForm').reset();
    } else {
        const err = await res.json();
        showAlert(err.message || 'Failed to register user');
    }
});

// Admin: Create Course
document.getElementById('courseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('courseName').value;
    const credits = parseInt(document.getElementById('courseCredits').value);
    const lectorIdVal = document.getElementById('courseLectorId').value;
    const lectorId = lectorIdVal ? parseInt(lectorIdVal) : null;
    
    const res = await fetchAuth('/courses', {
        method: 'POST',
        body: JSON.stringify({ name, credits, lectorId })
    });
    
    if (res.ok) {
        showAlert(`Course "${name}" created successfully!`, 'success');
        document.getElementById('courseForm').reset();
        loadAllCourses();
    } else {
        const err = await res.json();
        showAlert(err.message || 'Failed to create course');
    }
});

// Lector: Assign Grade
document.getElementById('gradeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const studentId = parseInt(document.getElementById('gradeStudentId').value);
    const courseId = parseInt(document.getElementById('gradeCourseId').value);
    const score = parseInt(document.getElementById('gradeScore').value);
    
    const res = await fetchAuth('/grades', {
        method: 'POST',
        body: JSON.stringify({ studentId, courseId, score })
    });
    
    if (res.ok) {
        showAlert(`Grade assigned successfully!`, 'success');
        document.getElementById('gradeForm').reset();
    } else {
        const err = await res.json();
        showAlert(err.message || 'Failed to assign grade');
    }
});

// Fetch Data Functions

async function loadAllCourses() {
    const res = await fetchAuth('/courses?page=0&size=100');
    if (res.ok) {
        const page = await res.json();
        const tbody = document.getElementById('coursesTableBody');
        tbody.innerHTML = '';
        
        if(page.content.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500 italic">No courses available.</td></tr>';
        } else {
            let courseOptions = '<option value="">-- Select Course --</option>';
            page.content.forEach(c => {
                courseOptions += `<option value="${c.id}">${c.name}</option>`;
                let actionHtml = '';
                if (userRole === 'STUDENT') {
                    actionHtml = `<button onclick="enrollCourse(${c.id})" class="text-blue-600 hover:text-blue-800 text-sm font-semibold">Enroll</button>`;
                } else if (userRole === 'ADMIN') {
                    actionHtml = `
                        <div class="flex justify-end space-x-2">
                            <button onclick="openLectorModal(${c.id})" class="text-blue-600 hover:text-blue-800 text-sm">Change Lector</button>
                            ${c.lectorEmail ? `<button onclick="removeLector(${c.id})" class="text-red-600 hover:text-red-800 text-sm">Remove</button>` : ''}
                        </div>
                    `;
                }

                tbody.innerHTML += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3">${c.id}</td>
                        <td class="p-3">${c.name}</td>
                        <td class="p-3">${c.credits}</td>
                        <td class="p-3">${c.lectorEmail || '<span class="text-gray-400 italic">Unassigned</span>'}</td>
                        ${(userRole === 'STUDENT' || userRole === 'ADMIN') ? `<td class="p-3 text-right">${actionHtml}</td>` : ''}
                    </tr>
                `;
            });
            if (userRole === 'LECTOR') {
                document.getElementById('gradeCourseId').innerHTML = courseOptions;
            }
        }
    }
}
document.getElementById('refreshCoursesBtn').addEventListener('click', loadAllCourses);

// Student Actions
async function loadMyGrades() {
    const res = await fetchAuth('/grades/my');
    if (res.ok) {
        const grades = await res.json();
        const tbody = document.getElementById('gradesTableBody');
        const noGradesMsg = document.getElementById('noGradesMsg');
        const gpaBadge = document.getElementById('studentGpaBadge');
        tbody.innerHTML = '';
        
        if (grades.length === 0) {
            noGradesMsg.classList.remove('hidden');
            gpaBadge.textContent = 'GPA: N/A';
        } else {
            noGradesMsg.classList.add('hidden');
            let totalScore = 0;
            
            grades.forEach(g => {
                totalScore += g.score;
                tbody.innerHTML += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3">${g.courseId}</td>
                        <td class="p-3">${g.courseName}</td>
                        <td class="p-3 font-bold text-right">${g.score}</td>
                    </tr>
                `;
            });
            
            const avg = (totalScore / grades.length).toFixed(1);
            gpaBadge.textContent = `Average Score: ${avg}`;
        }
    }
}
document.getElementById('refreshGradesBtn').addEventListener('click', loadMyGrades);

async function loadMyCourses() {
    const res = await fetchAuth('/courses/my-courses');
    if (res.ok) {
        const courses = await res.json();
        const tbody = document.getElementById('myCoursesTableBody');
        const noMyCoursesMsg = document.getElementById('noMyCoursesMsg');
        tbody.innerHTML = '';
        
        if (courses.length === 0) {
            noMyCoursesMsg.classList.remove('hidden');
        } else {
            noMyCoursesMsg.classList.add('hidden');
            courses.forEach(c => {
                tbody.innerHTML += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3">${c.id}</td>
                        <td class="p-3">${c.name}</td>
                        <td class="p-3">${c.credits}</td>
                        <td class="p-3">${c.lectorEmail || '<span class="text-gray-400 italic">Unassigned</span>'}</td>
                    </tr>
                `;
            });
        }
    }
}
document.getElementById('refreshMyCoursesBtn')?.addEventListener('click', loadMyCourses);

window.enrollCourse = async function(courseId) {
    const res = await fetchAuth(`/courses/${courseId}/enroll`, { method: 'POST' });
    if (res.ok) {
        showAlert('Enrolled successfully!', 'success');
        loadMyCourses();
    } else {
        const err = await res.json();
        showAlert(err.message || 'Failed to enroll');
    }
}

// Admin Actions: Lector Management
let currentCourseIdForLector = null;

window.openLectorModal = function(courseId) {
    currentCourseIdForLector = courseId;
    document.getElementById('modalCourseId').textContent = courseId;
    document.getElementById('newLectorId').value = '';
    document.getElementById('lectorModal').classList.remove('hidden');
}

window.closeLectorModal = function() {
    document.getElementById('lectorModal').classList.add('hidden');
    currentCourseIdForLector = null;
}

window.submitChangeLector = async function() {
    const lectorId = parseInt(document.getElementById('newLectorId').value);
    if (!lectorId) return;
    
    const res = await fetchAuth(`/courses/${currentCourseIdForLector}/lector/${lectorId}`, { method: 'PUT' });
    if (res.ok) {
        showAlert('Lector updated successfully!', 'success');
        closeLectorModal();
        loadAllCourses();
    } else {
        const err = await res.json();
        showAlert(err.message || 'Failed to update lector');
    }
}

window.removeLector = async function(courseId) {
    if (!confirm('Are you sure you want to remove the lector from this course?')) return;
    
    const res = await fetchAuth(`/courses/${courseId}/lector`, { method: 'DELETE' });
    if (res.ok) {
        showAlert('Lector removed successfully!', 'success');
        loadAllCourses();
    } else {
        const err = await res.json();
        showAlert(err.message || 'Failed to remove lector');
    }
}
