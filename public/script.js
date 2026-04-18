// ========== API CONFIGURATION ==========
// Update this to your Render backend URL after deployment
const API_BASE = 'https://future-fs-03-cj3x.onrender.com/'; // Your Render URL
const USE_BACKEND = true; // Set to true when backend is deployed

// ========== MOBILE MENU TOGGLE ==========
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// ========== SMOOTH SCROLLING ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ========== CONTACT FORM SUBMISSION ==========
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            service: document.getElementById('service').value,
            message: document.getElementById('message').value
        };
        
        // Show loading state
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        try {
            let response;
            let result;
            
            if (USE_BACKEND) {
                // Use backend API
                response = await fetch(`${API_BASE}/api/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                result = await response.json();
            } else {
                // Mock successful submission for demo
                await new Promise(resolve => setTimeout(resolve, 500));
                response = { ok: true };
                result = { message: '✅ Demo: Message received! (Backend coming soon)' };
            }
            
            if (response.ok) {
                formMessage.className = 'form-message success';
                formMessage.textContent = result.message || 'Message sent successfully! We will contact you within 24 hours.';
                contactForm.reset();
            } else {
                formMessage.className = 'form-message error';
                formMessage.textContent = result.error || 'Something went wrong. Please try again.';
            }
        } catch (error) {
            console.error('Contact form error:', error);
            formMessage.className = 'form-message error';
            formMessage.textContent = 'Network error. Please check your connection.';
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            // Hide message after 5 seconds
            setTimeout(() => {
                formMessage.className = 'form-message';
            }, 5000);
        }
    });
}

// ========== NEWSLETTER SUBSCRIPTION ==========
const newsletterForm = document.getElementById('newsletterForm');
const newsletterMessage = document.getElementById('newsletterMessage');

if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('newsletterEmail').value;
        const submitBtn = newsletterForm.querySelector('button');
        const originalText = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.innerHTML = '<span>Subscribing</span><span class="btn-icon">⏳</span>';
        submitBtn.disabled = true;
        
        try {
            let response;
            let result;
            
            if (USE_BACKEND) {
                // Use backend API
                response = await fetch(`${API_BASE}/api/subscribe`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });
                result = await response.json();
            } else {
                // Mock successful subscription for demo
                await new Promise(resolve => setTimeout(resolve, 500));
                response = { ok: true };
                result = { message: '✅ Demo: Subscribed! (Backend coming soon)' };
            }
            
            if (response.ok) {
                newsletterMessage.innerHTML = `<p style="color: #28a745; margin-top: 10px;">✓ ${result.message}</p>`;
                newsletterForm.reset();
            } else {
                newsletterMessage.innerHTML = `<p style="color: #dc3545; margin-top: 10px;">✗ ${result.error || 'Subscription failed. Please try again.'}</p>`;
            }
        } catch (error) {
            console.error('Newsletter error:', error);
            newsletterMessage.innerHTML = '<p style="color: #dc3545; margin-top: 10px;">✗ Network error. Please try again.</p>';
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            setTimeout(() => {
                newsletterMessage.innerHTML = '';
            }, 5000);
        }
    });
}

// ========== HERO SECTION SUBSCRIBE FORM ==========
const heroForm = document.getElementById('heroSubscribeForm');
const heroMessage = document.getElementById('heroMessage');

if (heroForm) {
    heroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('heroEmail').value;
        const button = heroForm.querySelector('button');
        const originalText = button.innerHTML;
        
        button.innerHTML = 'Sending...';
        button.disabled = true;
        
        try {
            let response;
            let result;
            
            if (USE_BACKEND) {
                // Use backend API
                response = await fetch(`${API_BASE}/api/subscribe`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });
                result = await response.json();
            } else {
                // Mock successful subscription for demo
                await new Promise(resolve => setTimeout(resolve, 500));
                response = { ok: true };
                result = { message: '✅ Demo: Subscribed! (Backend coming soon)' };
            }
            
            if (response.ok) {
                heroMessage.className = 'hero-message success';
                heroMessage.innerHTML = '✅ ' + result.message + '! We\'ll send your free trial info.';
                heroForm.reset();
            } else {
                heroMessage.className = 'hero-message error';
                heroMessage.innerHTML = '❌ ' + (result.error || 'Email already subscribed!');
            }
        } catch (error) {
            console.error('Hero subscribe error:', error);
            heroMessage.className = 'hero-message error';
            heroMessage.innerHTML = '❌ Network error. Please try again.';
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
            
            setTimeout(() => {
                heroMessage.className = 'hero-message';
            }, 5000);
        }
    });
}

// ========== HEALTH CHECK ==========
async function checkServerHealth() {
    if (!USE_BACKEND) {
        console.log('Backend disabled - running in demo mode');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/health`);
        const data = await response.json();
        console.log('Server status:', data.status);
        console.log('Database:', data.database);
    } catch (error) {
        console.log('Server not reachable - make sure backend is running');
    }
}

// Run health check on page load
checkServerHealth();

// ========== SCROLL EFFECTS ==========
// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
});

// Active link highlighting based on scroll position
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ========== ANIMATION ON SCROLL ==========
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Animate service cards, testimonial cards, and stat cards
document.querySelectorAll('.service-card, .testimonial-card, .stat-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});

// ========== FOOTER NEWSLETTER (if exists) ==========
const footerNewsletterForm = document.getElementById('footerNewsletterForm');
if (footerNewsletterForm) {
    footerNewsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = footerNewsletterForm.querySelector('input').value;
        
        try {
            let response;
            
            if (USE_BACKEND) {
                response = await fetch(`${API_BASE}/api/subscribe`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });
            } else {
                response = { ok: true };
            }
            
            if (response.ok) {
                alert('Subscribed successfully!');
                footerNewsletterForm.reset();
            } else {
                alert('Subscription failed. Please try again.');
            }
        } catch (error) {
            console.error('Footer newsletter error:', error);
            alert('Network error. Please try again.');
        }
    });
}

// ========== WHATSAPP BUTTON TOOLTIP ==========
const whatsappBtn = document.getElementById('whatsappBtn');
if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
        console.log('WhatsApp button clicked');
    });
}

// ========== LOGO CLICK ==========
const logo = document.querySelector('.logo');
if (logo) {
    logo.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

console.log('✅ Sol Tutoring Academy frontend loaded!');
console.log(`🔧 Backend mode: ${USE_BACKEND ? 'Connected to ' + API_BASE : 'Demo mode (no backend)'}`);