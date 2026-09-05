// ==========================================
// RAZORPAY PAYMENT PAGE LINKS
// ==========================================
// PLACEHOLDERS. Two Razorpay payment pages must be created in Dr. Madhu's
// Razorpay account (Rs 900 trial, Rs 2,400 monthly) and pasted here before
// go-live. Until then the buttons take the visitor to the thank-you page with
// ?pending=1 so the flow can be tested end to end without charging anyone.
const RAZORPAY_LINKS = {
  trial:   "",   // 10 day trial, Rs 900
  monthly: ""    // 30 day pack, Rs 2,400
};

// Kit form that stores the lead before payment. PLACEHOLDER: create an Agni
// form in Kit and paste its id here. Modak uses 9433191; do not reuse it,
// or Agni leads land in the Modak sequence.
const KIT_FORM_ID = "";

let selectedPack = "monthly";

function openModal(pack) {
  const directPacks = ['trial','monthly'];
  let preselect = directPacks.includes(pack) ? pack : 'monthly';
  selectPack(preselect);
  if (typeof fbq !== 'undefined') fbq('track', 'InitiateCheckout', { content_name: selectedPack });
  document.getElementById("leadModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

function selectPack(pack) {
  selectedPack = pack;
  try { localStorage.setItem("agniPack", pack); } catch (e) {}
  document.querySelectorAll('.pack-opt').forEach(el => {
    el.classList.toggle('selected', el.dataset.pack === pack);
  });
}

function closeModal() {
  document.getElementById("leadModal").classList.remove("active");
  document.body.style.overflow = "";
}

function closeModalOutside(e) {
  if (e.target.id === "leadModal") closeModal();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

function showFormError(msg) {
  let box = document.getElementById("formError");
  if (!box) {
    box = document.createElement("div");
    box.id = "formError";
    box.className = "form-error";
    document.getElementById("leadForm").prepend(box);
  }
  box.textContent = msg;
  box.style.display = "block";
}

function handleFormSubmit(e) {
  e.preventDefault();
  const g = (n) => { const el = e.target.querySelector(`[name="${n}"]`); return el ? el.value.trim() : ""; };
  const email = g("email_address");
  const firstName = g("fields[first_name]");
  const phone = g("fields[phone_number]");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) { showFormError("Please enter a valid email address"); return; }
  if (firstName.length < 2) { showFormError("Please enter your name"); return; }
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 8 || phoneDigits.length > 15) { showFormError("Please enter a valid phone number"); return; }

  const selectedCard = document.querySelector('.pack-opt.selected');
  const pack = (selectedCard && selectedCard.dataset.pack) || selectedPack || "monthly";
  const formData = new FormData(e.target);

  if (KIT_FORM_ID) {
    fetch("https://app.kit.com/forms/" + KIT_FORM_ID + "/subscriptions", {
      method: "POST",
      body: new URLSearchParams(formData)
    }).catch(() => {});
  }

  if (typeof fbq !== 'undefined') fbq('track', 'AddToCart', { content_name: pack });

  startRazorpayCheckout(pack, firstName, email, phoneDigits);
}

function startRazorpayCheckout(pack, name, email, phone) {
  const btn = document.querySelector("#leadForm button[type='submit']");
  if (btn) { btn.disabled = true; btn.innerHTML = "Taking you to payment…"; }

  try { localStorage.setItem("agniPack", pack); } catch (e) {}

  const link = RAZORPAY_LINKS[pack] || RAZORPAY_LINKS.monthly;
  if (!link) {
    // No payment page yet. Go to the thank-you page in test mode.
    window.location.href = "/thank-you?pending=1&pack=" + encodeURIComponent(pack);
    return;
  }

  const url = link
    + "?prefill[name]=" + encodeURIComponent(name || "")
    + "&prefill[email]=" + encodeURIComponent(email || "")
    + "&prefill[contact]=" + encodeURIComponent(phone || "");
  window.location.href = url;
}

// ==========================================
// LANGUAGE TOGGLE (EN / HI)
// Every element with data-hi keeps its English in data-en on first switch.
// ==========================================
function setLang(lang) {
  document.querySelectorAll('[data-hi]').forEach(el => {
    if (!el.dataset.en) el.dataset.en = el.innerHTML;
    el.innerHTML = lang === 'hi' ? el.dataset.hi : el.dataset.en;
  });
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
  try { localStorage.setItem('agniLang', lang); } catch (e) {}
}
(function () {
  let saved = null;
  try { saved = localStorage.getItem('agniLang'); } catch (e) {}
  if (saved === 'hi') setLang('hi');
})();

// ==========================================
// TESTIMONIAL CAROUSEL
// ==========================================
const testimonialCarousel = {
  currentIndex: 0,
  totalSlides: 7,
  autoPlayInterval: null,
  init() {
    this.updateCarousel();
    this.startAutoPlay();
    const w = document.querySelector('.testimonial-carousel-wrapper');
    w.addEventListener('mouseenter', () => this.stopAutoPlay());
    w.addEventListener('mouseleave', () => this.startAutoPlay());
    let startX = 0;
    w.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, {passive:true});
    w.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { dx < 0 ? this.next() : this.prev(); }
    }, {passive:true});
  },
  updateCarousel() {
    const carousel = document.getElementById('testimonialCarousel');
    carousel.style.transform = `translateX(${-this.currentIndex * 100}%)`;
    document.querySelectorAll('.dot').forEach((dot, idx) => dot.classList.toggle('active', idx === this.currentIndex));
  },
  next() { this.currentIndex = (this.currentIndex + 1) % this.totalSlides; this.updateCarousel(); this.restartAutoPlay(); },
  prev() { this.currentIndex = (this.currentIndex - 1 + this.totalSlides) % this.totalSlides; this.updateCarousel(); this.restartAutoPlay(); },
  goTo(i) { this.currentIndex = i; this.updateCarousel(); this.restartAutoPlay(); },
  startAutoPlay() { this.autoPlayInterval = setInterval(() => this.next(), 6000); },
  stopAutoPlay() { clearInterval(this.autoPlayInterval); },
  restartAutoPlay() { this.stopAutoPlay(); this.startAutoPlay(); }
};
document.addEventListener('DOMContentLoaded', () => { testimonialCarousel.init(); });

function toggleFaq(item) { item.classList.toggle("active"); }

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add("in-view"); observer.unobserve(entry.target); }
  });
}, { threshold: 0.1 });
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

// ==========================================
// DISCOUNT TIMER (4 HOURS, same as Modak)
// ==========================================
function startDiscountTimer() {
  let timeLeft = 4 * 60 * 60;
  const el = document.getElementById('discountTimer');
  setInterval(() => {
    const h = Math.floor(timeLeft / 3600), m = Math.floor((timeLeft % 3600) / 60), s = timeLeft % 60;
    el.textContent = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (timeLeft > 0) timeLeft--;
  }, 1000);
}
startDiscountTimer();

// ==========================================
// EXIT INTENT POPUP
// ==========================================
let exitIntentTriggered = false;
document.addEventListener('mouseleave', function(e) {
  if (e.clientY < 10 && !exitIntentTriggered) {
    exitIntentTriggered = true;
    document.getElementById('exitPopup').classList.add('active');
  }
});
function closeExitPopup() { document.getElementById('exitPopup').classList.remove('active'); }
function acceptOfferAndScroll() {
  document.getElementById('exitPopup').classList.remove('active');
  setTimeout(() => { openModal('trial'); }, 300);
}
document.getElementById('exitPopup').addEventListener('click', function(e) {
  if (e.target.id === 'exitPopup') closeExitPopup();
});

// === HERO IMAGE SLIDER ===
(function() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  if (!slides.length) return;
  let current = 0, timer = null;
  function show(i) {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, idx) => s.classList.toggle('active', idx === current));
    dots.forEach((d, idx) => d.classList.toggle('active', idx === current));
  }
  function next() { show(current + 1); }
  function start() { timer = setInterval(next, 5000); }
  function reset() { clearInterval(timer); start(); }
  window.heroGoTo = function(i) { show(i); reset(); };
  const slider = document.getElementById('heroSlider');
  let startX = 0;
  slider.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, {passive:true});
  slider.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) { dx < 0 ? next() : show(current - 1); reset(); }
  }, {passive:true});
  start();
})();
