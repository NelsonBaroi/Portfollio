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

// This effect will make the profile image pulse and change colors when hovered over, creating an interactive experience:
const profileImage = document.getElementById('profile-image');

document.addEventListener('mousemove', (e) => {
  const { clientX: mouseX, clientY: mouseY } = e;
  const imageRect = profileImage.getBoundingClientRect();
  
  const centerX = imageRect.left + imageRect.width / 2;
  const centerY = imageRect.top + imageRect.height / 2;
  
  const deltaX = (mouseX - centerX) * 0.1; // Smooth movement
  const deltaY = (mouseY - centerY) * 0.1;
  
  profileImage.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
});

profileImage.addEventListener('mouseenter', () => {
  profileImage.style.transition = 'transform 0.1s ease, box-shadow 0.3s ease';
  profileImage.style.boxShadow = '0px 10px 25px rgba(0, 255, 255, 0.6)';
});

profileImage.addEventListener('mouseleave', () => {
  profileImage.style.transition = 'transform 0.5s ease, box-shadow 0.5s ease';
  profileImage.style.transform = 'translate(0, 0)';
  profileImage.style.boxShadow = '0px 5px 15px rgba(0, 0, 0, 0.2)';
});

