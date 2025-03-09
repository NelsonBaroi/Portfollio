// Preloader Animation
window.addEventListener('load', () => {
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    // Fade out the preloader
    preloader.style.opacity = '0';
    setTimeout(() => {
      // Hide the preloader completely
      preloader.style.display = 'none';
    }, 500); // Matches the CSS transition duration
  }
});

// Fallback in case the 'load' event doesn't fire
setTimeout(() => {
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 500);
  }
}, 3000); // Fallback after 3 seconds

// GSAP Scroll Animations
gsap.registerPlugin(ScrollTrigger);

// Fade-in effect for sections
document.addEventListener('DOMContentLoaded', () => {
  gsap.utils.toArray('.section').forEach(section => {
    gsap.from(section, {
      opacity: 0,
      y: 50,
      duration: 1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        toggleActions: 'play none none none'
      }
    });
  });
});

//password protection

document.getElementById('passwordForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const password = document.getElementById('password').value;
  const correctPassword = 'secret123'; // CHANGE THIS PASSWORD
  
  if(password === correctPassword) {
      document.getElementById('login').style.display = 'none';
      document.getElementById('content').style.display = 'block';
      document.getElementById('error').style.display = 'none';
  } else {
      document.getElementById('error').style.display = 'block';
  }
});

// Handle file clicks (you can add additional functionality here)
const files = document.querySelectorAll('.file');

files.forEach(file => {
    file.addEventListener('click', function() {
        alert(`You clicked on: ${this.querySelector('.file-name').innerText}`);
    });
});