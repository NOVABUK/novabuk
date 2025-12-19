// Select all nav links
const navLinks = document.querySelectorAll('.nav-menu ul li a');
// Select the navigation toggle button and its icon
const navToggleBtn = document.getElementById('navToggle');
const navToggleIcon = navToggleBtn ? navToggleBtn.querySelector('i') : null;

// Get current page path
const currentPath = window.location.pathname;

// Loop through links and set active class (Navigation Highlight)
navLinks.forEach(link => {
    // Check for both relative and absolute paths
    if(link.getAttribute('href') === currentPath || link.getAttribute('href') === '.' + currentPath) {
        link.classList.add('active');
    }
});

// Select all hero buttons
const heroButtons = document.querySelectorAll('.button a');

// Hero Button Active Class Toggle
heroButtons.forEach(button => {
    button.addEventListener('click', function(e) {
        // e.preventDefault(); // Uncomment if you don't want the links to navigate
        // Remove active from all buttons
        heroButtons.forEach(btn => btn.classList.remove('active'));
        // Add active to clicked button
        this.classList.add('active');
    });
});

/**
 * Toggles the mobile navigation menu open/closed state
 * and switches the hamburger icon to a close icon.
 */
function toggleMenu() {
    const menu = document.getElementById("navMenu");

    if (!menu || !navToggleBtn || !navToggleIcon) return;

    // 1. Toggle the 'open' class for CSS-driven visibility
    menu.classList.toggle('open');
    const isMenuOpen = menu.classList.contains('open');

    // 2. Switch the icon: fa-bars (closed) <-> fa-times or fa-xmark (open)
    if (isMenuOpen) {
        // Switch to the close icon
        // Using 'fa-xmark' as it is the current standard in Font Awesome 6
        navToggleIcon.classList.remove('fa-bars');
        navToggleIcon.classList.add('fa-xmark');
        navToggleBtn.setAttribute('aria-expanded', 'true');
    } else {
        // Switch back to the hamburger icon
        navToggleIcon.classList.remove('fa-xmark');
        navToggleIcon.classList.add('fa-bars');
        navToggleBtn.setAttribute('aria-expanded', 'false');
    }

    // 3. Robustness check for smaller screens (less than 1024px, based on your CSS)
    if (window.innerWidth <= 1023) {
        menu.style.display = isMenuOpen ? 'block' : 'none';
    } else {
        // remove inline style on larger screens so desktop CSS remains authoritative
        menu.style.display = '';
    }

    console.log('toggleMenu executed — open:', isMenuOpen);
}

// Wire up hamburger toggle click event
if (navToggleBtn) {
    navToggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        toggleMenu();
        this.classList.toggle('open');
    });
}

// Close mobile menu when a nav link is clicked (for smoother mobile navigation)
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        const menu = document.getElementById('navMenu');
        const toggle = document.getElementById('navToggle');
        if (menu && menu.classList.contains('open')) {
            // Only call toggleMenu if the menu is open to close it
            toggleMenu(); 
        }
    });
});
    
    const mvpToggle = document.getElementById('mvp-toggle');
    const aiToggle = document.getElementById('ai-toggle');
    const mvpContent = document.getElementById('mvp-content');
    const aiContent = document.getElementById('ai-content');

    // Function to handle the state change
    function setActive(selectedToggle, unselectedToggle, selectedContent, unselectedContent) {
        // 1. Toggle the 'active' class on the buttons
        selectedToggle.classList.add('active');
        unselectedToggle.classList.remove('active');

        // 2. Toggle the 'active-content' class on the content panels
        selectedContent.classList.add('active-content');
        unselectedContent.classList.remove('active-content');
    }

    // Add event listeners to each button
    mvpToggle.addEventListener('click', () => {
        setActive(mvpToggle, aiToggle, mvpContent, aiContent);
    });

    aiToggle.addEventListener('click', () => {
        setActive(aiToggle, mvpToggle, aiContent, mvpContent);
    });

    // const Message = document.getElementById('message');

    // Message.addEventListener('input', (e) => {
    //     e.preventDefault();
    //         console.log('You are typing...');
        
    // });