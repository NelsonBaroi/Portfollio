// Nelson Baroi — Portfolio Script

// GSAP Scroll Animations
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  document.addEventListener('DOMContentLoaded', () => {
    gsap.utils.toArray('.section').forEach(section => {
      gsap.from(section, {
        opacity: 0, y: 40, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 85%', toggleActions: 'play none none none' }
      });
    });
  });
}

// Profile Image Interaction
document.addEventListener('DOMContentLoaded', () => {
  const img = document.getElementById('profile-image');
  if (!img) return;

  document.addEventListener('mousemove', (e) => {
    const rect = img.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.05;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.05;
    img.style.transform = `translate(${dx}px, ${dy}px)`;
  });

  img.addEventListener('mouseenter', () => {
    img.style.boxShadow = '0px 10px 25px rgba(0, 190, 190, 0.5)';
  });

  img.addEventListener('mouseleave', () => {
    img.style.transform = 'translate(0, 0)';
    img.style.boxShadow = '0px 5px 15px rgba(0, 0, 0, 0.2)';
  });
});

// Password protection (personal.html)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('passwordForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      if (document.getElementById('password').value === 'nbaroi') {
        document.getElementById('login').style.display = 'none';
        document.getElementById('content').style.display = 'block';
      } else {
        const err = document.getElementById('error');
        if (err) err.style.display = 'block';
      }
    });
  }
});
