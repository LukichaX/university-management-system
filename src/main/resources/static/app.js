const API_BASE = '/api';

// State
let token = localStorage.getItem('token');
let userRole = localStorage.getItem('role');

// DOM Elements
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const userInfo = document.getElementById('userInfo');
const userRoleBadge = document.getElementById('userRoleBadge');
const userEmailBadge = document.getElementById('userEmailBadge');
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
    const bg = type === 'error' ? 'bg-red-500/80 border-red-400' : 'bg-emerald-500/80 border-emerald-400';
    const alertId = 'alert-' + Date.now();
    const alertHtml = `
        <div id="${alertId}" class="p-4 rounded-xl border ${bg} backdrop-blur-md text-white shadow-xl flex justify-between items-center transform transition-all duration-300 translate-x-10 opacity-0">
            <div class="flex items-center gap-3">
                ${type === 'error' ? 
                    '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' : 
                    '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'}
                <span class="font-medium">${message}</span>
            </div>
            <button onclick="document.getElementById('${alertId}').remove()" class="text-white hover:text-gray-200 focus:outline-none">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
    `;
    alertContainer.insertAdjacentHTML('beforeend', alertHtml);
    
    // Animate in
    requestAnimationFrame(() => {
        const el = document.getElementById(alertId);
        if(el) { el.classList.remove('translate-x-10', 'opacity-0'); }
    });

    // Auto remove
    setTimeout(() => {
        const el = document.getElementById(alertId);
        if (el) {
            el.classList.add('opacity-0', 'translate-x-10');
            setTimeout(() => el.remove(), 300);
        }
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

// Helper: Decode JWT to check expiration and get Email
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
    
    userEmailBadge.textContent = payload.sub; // The user's email
    userRoleBadge.textContent = userRole;
    
    // Switch views
    adminSection.classList.add('hidden');
    lectorSection.classList.add('hidden');
    studentSection.classList.add('hidden');
    
    document.getElementById('courseActionHeader').classList.add('hidden');
    
    if (userRole === 'ADMIN') {
        adminSection.classList.remove('hidden');
        document.getElementById('courseActionHeader').classList.remove('hidden');
        populateLectorDropdowns();
        loadAllUsers();
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
        userRole = data.role; 
        
        localStorage.setItem('token', token);
        localStorage.setItem('role', userRole);
        
        document.getElementById('loginForm').reset();
        initSession();
        showAlert('Welcome back!', 'success');
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
        loadAllUsers();
        populateLectorDropdowns();
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
        showAlert(`Grade saved successfully!`, 'success');
        document.getElementById('gradeForm').reset();
    } else {
        const err = await res.json();
        showAlert(err.message || 'Failed to assign grade');
    }
});

// Fetch Data Functions

async function loadAllUsers() {
    const res = await fetchAuth('/users');
    if (res.ok) {
        const users = await res.json();
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';
        
        const currentUserEmail = parseJwt(token).sub;
        
        users.forEach(u => {
            let deleteBtn = u.email === currentUserEmail ? 
                '<span class="text-gray-500 italic text-xs">Current</span>' : 
                `<button onclick="deleteUser(${u.id})" class="bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 px-3 py-1 rounded-lg text-xs font-semibold transition-colors">Delete</button>`;
            
            tbody.innerHTML += `
                <tr class="hover:bg-white/10 transition-colors">
                    <td class="p-4">${u.id}</td>
                    <td class="p-4">${u.email}</td>
                    <td class="p-4"><span class="bg-white/10 px-2 py-1 rounded text-xs font-semibold tracking-wider">${u.role}</span></td>
                    <td class="p-4 text-right">${deleteBtn}</td>
                </tr>
            `;
        });
    }
}
document.getElementById('refreshUsersBtn')?.addEventListener('click', loadAllUsers);

window.deleteUser = async function(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    const res = await fetchAuth(`/users/${userId}`, { method: 'DELETE' });
    if (res.ok) {
        showAlert('User deleted successfully!', 'success');
        loadAllUsers();
        populateLectorDropdowns();
    } else {
        const err = await res.json();
        showAlert(err.message || 'Failed to delete user');
    }
}

window.deleteCourse = async function(courseId) {
    if (!confirm('Are you sure you want to delete this course? All associated grades will be lost.')) return;
    
    const res = await fetchAuth(`/courses/${courseId}`, { method: 'DELETE' });
    if (res.ok) {
        showAlert('Course deleted successfully!', 'success');
        loadAllCourses();
    } else {
        const err = await res.json();
        showAlert(err.message || 'Failed to delete course');
    }
}

async function loadAllCourses() {
    const res = await fetchAuth('/courses?page=0&size=100');
    if (res.ok) {
        const page = await res.json();
        const tbody = document.getElementById('coursesTableBody');
        tbody.innerHTML = '';
        
        const userEmail = parseJwt(token).sub;
        
        if(page.content.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-300 italic">No courses available.</td></tr>';
        } else {
            let courseOptions = '<option value="">-- Select Course --</option>';
            page.content.forEach(c => {
                if (userRole === 'LECTOR' && c.lectorEmail === userEmail) {
                    courseOptions += `<option value="${c.id}">${c.name}</option>`;
                }
                
                let actionHtml = '';
                if (userRole === 'STUDENT') {
                    actionHtml = `<button onclick="enrollCourse(${c.id})" class="bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-200 border border-indigo-500/30 px-3 py-1 rounded-lg text-xs font-semibold transition-colors">Enroll</button>`;
                } else if (userRole === 'ADMIN') {
                    actionHtml = `
                        <div class="flex justify-end space-x-2">
                            <button onclick="openLectorModal(${c.id})" class="bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 border border-blue-500/30 px-3 py-1 rounded-lg text-xs font-semibold transition-colors">Change Lector</button>
                            ${c.lectorEmail ? `<button onclick="removeLector(${c.id})" class="bg-orange-500/20 hover:bg-orange-500/40 text-orange-200 border border-orange-500/30 px-3 py-1 rounded-lg text-xs font-semibold transition-colors">Remove Lector</button>` : ''}
                            <button onclick="deleteCourse(${c.id})" class="bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/30 px-3 py-1 rounded-lg text-xs font-semibold transition-colors">Delete</button>
                        </div>
                    `;
                }

                tbody.innerHTML += `
                    <tr class="hover:bg-white/10 transition-colors">
                        <td class="p-4">${c.id}</td>
                        <td class="p-4 font-medium">${c.name}</td>
                        <td class="p-4">${c.credits}</td>
                        <td class="p-4">${c.lectorEmail || '<span class="text-gray-400 italic text-sm">Unassigned</span>'}</td>
                        ${(userRole === 'STUDENT' || userRole === 'ADMIN') ? `<td class="p-4 text-right">${actionHtml}</td>` : ''}
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
                let colorClass = g.score >= 90 ? 'text-emerald-400' : g.score >= 70 ? 'text-blue-400' : g.score >= 50 ? 'text-yellow-400' : 'text-red-400';
                
                tbody.innerHTML += `
                    <tr class="hover:bg-white/10 transition-colors">
                        <td class="p-4">${g.courseId}</td>
                        <td class="p-4">${g.courseName}</td>
                        <td class="p-4 font-bold text-right ${colorClass}">${g.score}</td>
                    </tr>
                `;
            });
            
            const avg = (totalScore / grades.length).toFixed(1);
            gpaBadge.textContent = `Average: ${avg}`;
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
                    <tr class="hover:bg-white/10 transition-colors">
                        <td class="p-4">${c.id}</td>
                        <td class="p-4 font-medium">${c.name}</td>
                        <td class="p-4">${c.credits}</td>
                        <td class="p-4">${c.lectorEmail || '<span class="text-gray-400 italic text-sm">Unassigned</span>'}</td>
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
        showAlert('Successfully enrolled!', 'success');
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
