// Main JavaScript for Landing Page
document.addEventListener('DOMContentLoaded', function () {
    console.log('VAULT Platform loaded');
    initLandingPage();
});

function initLandingPage() {
    // Initialize components
    initNavigation();
    initInvestmentCalculator();
    initPlanSelection();
    initFAQ();
    initAuthButtons();

    // Check user authentication
    checkAuthStatus();
    checkAboutUs();
}

// Navigation
function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function () {
            navMenu.classList.toggle('active');
            this.innerHTML = navMenu.classList.contains('active')
                ? '<i class="fas fa-times"></i>'
                : '<i class="fas fa-bars"></i>';
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Investment Calculator
function initInvestmentCalculator() {
    const calcAmount = document.getElementById('calcAmount');
    const calcPeriod = document.getElementById('calcPeriod');
    const selectedPeriod = document.getElementById('selectedPeriod');

    if (!calcAmount || !calcPeriod) return;

    function calculateReturns() {
        const amount = parseFloat(calcAmount.value) || 1000;
        const weeks = parseInt(calcPeriod.value) || 4;
        const rate = 0.5; // 50% weekly

        // Calculate compound interest
        const total = amount * Math.pow(1 + rate, weeks);
        const returns = total - amount;

        // Update UI
        if (selectedPeriod) {
            selectedPeriod.textContent = `${weeks} Week${weeks > 1 ? 's' : ''}`;
        }

        document.getElementById('calcInvestment').textContent = formatCurrency(amount);
        document.getElementById('calcReturns').textContent = formatCurrency(returns);
        document.getElementById('calcTotal').textContent = formatCurrency(total);
    }

    // Initial calculation
    calculateReturns();

    // Update on input
    calcAmount.addEventListener('input', calculateReturns);
    calcPeriod.addEventListener('input', calculateReturns);
}

// Plan Selection
function initPlanSelection() {
    document.querySelectorAll('.plan-select').forEach(button => {
        button.addEventListener('click', function () {
            const planName = this.closest('.plan-card').querySelector('h3').textContent;
            showNotification(`Please sign up to select the ${planName} plan`, 'info');
        });
    });
}

// FAQ Accordion
function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function () {
            const item = this.closest('.faq-item');
            item.classList.toggle('active');

            // Toggle icon
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-chevron-down');
                icon.classList.toggle('fa-chevron-up');
            }
        });
    });
}

// Authentication Buttons
function initAuthButtons() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const startInvestingBtn = document.getElementById('startInvesting');
    const ctaSignupBtn = document.getElementById('ctaSignup');

    // Set up button actions
    if (loginBtn) {
        loginBtn.addEventListener('click', function () {
            window.location.href = 'login.html';
        });
    }

    if (signupBtn) {
        signupBtn.addEventListener('click', function () {
            window.location.href = 'register.html';
        });
    }

    if (startInvestingBtn) {
        startInvestingBtn.addEventListener('click', function () {
            window.location.href = 'register.html';
        });
    }

    if (ctaSignupBtn) {
        ctaSignupBtn.addEventListener('click', function () {
            window.location.href = 'register.html';
        });
    }
}
function checkAboutUs() {
    const aboutUsBtn = document.getElementById('aboutUsBtn');

    aboutUsBtn.addEventListener('click', function () {
        window.location.href = 'aboutUs.html';
    });

}

// Check Authentication Status
async function checkAuthStatus() {
    try {
        // Initialize Supabase
        const SUPABASE_URL = 'https://grfrcnhmnvasiotejiok.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k';
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            updateAuthButtons(true, user);
        } else {
            updateAuthButtons(false);
        }
    } catch (error) {
        console.error('Auth check error:', error);
        updateAuthButtons(false);
    }
}

// Update Authentication Buttons
function updateAuthButtons(isLoggedIn, user = null) {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');

    if (isLoggedIn) {
        // User is logged in
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            loginBtn.onclick = function () {
                logoutUser();
            };
        }

        if (signupBtn) {
            signupBtn.innerHTML = '<i class="fas fa-dashboard"></i> Dashboard';
            signupBtn.onclick = function () {
                window.location.href = 'dashboard.html';
            };
        }
    } else {
        // User is not logged in
        if (loginBtn) {
            loginBtn.innerHTML = 'Sign In';
            loginBtn.onclick = function () {
                window.location.href = 'login.html';
            };
        }

        if (signupBtn) {
            signupBtn.innerHTML = 'Get Started';
            signupBtn.onclick = function () {
                window.location.href = 'register.html';
            };
        }
    }
}

// Logout User
async function logoutUser() {
    try {
        // Initialize Supabase
        const SUPABASE_URL = 'https://grfrcnhmnvasiotejiok.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k';
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        // Sign out
        const { error } = await supabase.auth.signOut();

        if (error) throw error;

        showNotification('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed', 'error');
    }
}

// Utility Functions
function formatCurrency(amount) {
    return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification-toast').forEach(el => el.remove());

    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;

    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        info: 'info-circle'
    };

    toast.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icons[type] || 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;

    document.body.appendChild(toast);

    // Close button
    toast.querySelector('.notification-close').addEventListener('click', () => {
        toast.remove();
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        border-left: 4px solid #4361ee;
        max-width: 400px;
    }
    
    .notification-toast.success {
        border-left-color: #4cc9f0;
    }
    
    .notification-toast.error {
        border-left-color: #f72585;
    }
    
    .notification-toast.info {
        border-left-color: #4361ee;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-content i {
        font-size: 1.2rem;
    }
    
    .notification-toast.success i {
        color: #4cc9f0;
    }
    
    .notification-toast.error i {
        color: #f72585;
    }
    
    .notification-toast.info i {
        color: #4361ee;
    }
    
    .notification-close {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: #6b7280;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(notificationStyles);

// Initialize animations
function initAnimations() {
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, { threshold: 0.1 });

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .plan-card, .testimonial-card').forEach(el => {
        observer.observe(el);
    });
}

// Add animation styles
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    .feature-card,
    .plan-card,
    .testimonial-card {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
    
    .feature-card.animated,
    .plan-card.animated,
    .testimonial-card.animated {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(animationStyles);

// Initialize animations on load
window.addEventListener('load', initAnimations);