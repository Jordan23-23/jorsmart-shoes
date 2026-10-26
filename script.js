"use strict";

// Product truth lives here. V1 had no descriptions; these contain name/category only.
const PRODUCTS = [
{ id: "patent-loafer", name: "Two-Tone Patent Loafer", category: "Loafers", description: "Two-Tone Patent Loafer · Loafers", image: "images/loafer-black-white-patent.jpg", price: null },
{ id: "monk-strap", name: "Double Monk Strap — John Foster", category: "Dress Shoes", description: "Double Monk Strap — John Foster · Dress Shoes", image: "images/john-foster-monk-black.jpg", price: null, orderName: "Double Monk Strap" },
{ id: "oxford-brogue", name: "Oxford Brogue — Coffee/Black", category: "Dress Shoes", description: "Oxford Brogue — Coffee/Black · Dress Shoes", image: "images/oxford-brogue-coffee-black.jpg", price: null, orderName: "Oxford Brogue" },
{ id: "buckle-loafer", name: "Leather Loafer with Buckle", category: "Loafers", description: "Leather Loafer with Buckle · Loafers", image: "images/loafer-black-buckle.jpg", price: null },
{ id: "suede-loafer", name: "Suede Logo Loafer", category: "Loafers", description: "Suede Logo Loafer · Loafers", image: "images/suede-loafer-logo-black.jpg", price: null },
{ id: "clarks-slides", name: "Clarks Leather Slides", category: "Slides", description: "Clarks Leather Slides · Slides", image: "images/clarks-slides-black.jpg", price: null }
];
const WHATSAPP = "https://wa.me/233507525267";
// Requested selection labels, not a claim of available sizes or stock.
const SIZES = ["UK 40", "UK 41", "UK 42", "UK 43", "UK 44", "UK 45", "UK 46"];
const CART_KEY = "jorsmart-cart-v2";
const arrow = '<svg class="arrow-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 18 18 6M6 6h12v12"/></svg>';
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const whatsappURL = (message) => `${WHATSAPP}?text=${encodeURIComponent(message).replace(/'/g, "%27")}`;
const productURL = (product) => whatsappURL(`Hello JorSmart Shoes, I'd like to order the ${product.orderName || product.name}. My size is __. Is it available?`);
const productById = (id) => PRODUCTS.find((product) => product.id === id);
const validQuantity = (value) => Number.isSafeInteger(value) && value > 0;
const hasPrice = (product) => typeof product.price === "number" && Number.isFinite(product.price) && product.price >= 0;
const money = (value) => new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(value);
const priceText = (product) => hasPrice(product) ? money(product.price) : "";
const sizeOptions = (selected = "") => SIZES.map((size) => `<option value="${size}"${size === selected ? " selected" : ""}>${size}</option>`).join("");
const imageMarkup = (product, className = "product-image", lazy = true) => `<div class="${className} image-frame"><img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" ${lazy ? 'loading="lazy"' : 'loading="eager"'} width="900" height="1000"><div class="image-fallback" aria-hidden="true"><span class="fallback-monogram">JS</span><span>${escapeHTML(product.name)}</span><small>Photography coming soon</small></div></div>`;
function initializeImages(root = document) {
root.querySelectorAll(".image-frame img").forEach((image) => {
const frame = image.closest(".image-frame");
const update = () => {
const missing = !image.naturalWidth;
frame.classList.toggle("image-missing", missing);
if (missing) {
frame.setAttribute("role", "img");
frame.setAttribute("aria-label", `${image.alt}. Photography coming soon.`);
image.setAttribute("aria-hidden", "true");
} else {
frame.removeAttribute("role");
frame.removeAttribute("aria-label");
image.removeAttribute("aria-hidden");
}
};
image.addEventListener("load", update);
image.addEventListener("error", update);
if (image.complete) update();
});
}
const grid = document.querySelector("#product-grid");
grid.innerHTML = PRODUCTS.map((product) => `<article class="product" data-category="${product.category}" data-id="${product.id}">
<button class="product-open" type="button" data-detail="${product.id}" aria-label="View ${escapeHTML(product.name)} details">${imageMarkup(product)}</button>
<div class="product-meta"><span>${product.category}</span></div>
<h3><button class="product-title" type="button" data-detail="${product.id}">${escapeHTML(product.name)}</button></h3>
<div class="price-slot">${priceText(product)}</div>
<a class="order-link" href="${productURL(product)}" target="_blank" rel="noopener noreferrer" aria-label="Order ${escapeHTML(product.name)} on WhatsApp">Order on WhatsApp ${arrow}</a>
</article>`).join("");
initializeImages();

const detailDialog = document.querySelector("#product-dialog");
const cartDialog = document.querySelector("#cart-dialog");
const cartTrigger = document.querySelector("#open-cart");
const cartItems = document.querySelector("#cart-items");
const cartStatus = document.querySelector("#cart-status");
const storageNotice = document.querySelector("#storage-notice");
const checkoutLink = document.querySelector("#checkout-link");
let cart = [];
let detailProduct;
function normalizeCart(value) {
const clean = [];
if (!Array.isArray(value)) return clean;
value.forEach((item) => {
if (!item || !productById(item.id) || !SIZES.includes(item.size) || !validQuantity(item.quantity)) return;
const existing = clean.find((row) => row.id === item.id && row.size === item.size);
if (existing) {
if (validQuantity(existing.quantity + item.quantity)) existing.quantity += item.quantity;
} else clean.push({ id: item.id, size: item.size, quantity: item.quantity });
});
return clean;
}
try {
cart = normalizeCart(JSON.parse(localStorage.getItem(CART_KEY) || "[]"));
} catch {
storageNotice.textContent = "Saved cart could not be loaded. You can still shop in this session.";
}
function saveCart() {
try {
localStorage.setItem(CART_KEY, JSON.stringify(cart));
storageNotice.textContent = "";
} catch {
storageNotice.textContent = "Your browser cannot save this cart. It will stay available in this session.";
}
}
function checkoutMessage() {
return ["Hello JorSmart Shoes, I'd like to order:", ...cart.map((item, index) => `${index + 1}. ${productById(item.id).name} — Size: ${item.size} — Quantity: ${item.quantity}`), "Please confirm availability, prices and fulfilment details."].join("\n");
}
function renderCart() {
const count = cart.reduce((total, item) => total + item.quantity, 0);
document.querySelector("#cart-count").textContent = count;
cartTrigger.setAttribute("aria-label", `Open cart, ${count} ${count === 1 ? "item" : "items"}`);
document.querySelector("#cart-units").textContent = ` · ${count}`;
cartItems.innerHTML = cart.length ? cart.map((item, index) => {
const product = productById(item.id);
return `<article class="cart-item" data-index="${index}">
${imageMarkup(product, "cart-image", false)}
<div class="cart-item-info"><h3>${escapeHTML(product.name)}</h3><p>${product.category}</p>
<div class="price-slot">${priceText(product)}</div>
<label class="field-label" for="cart-size-${index}">Size</label>
<select id="cart-size-${index}" data-action="size" aria-label="Size for ${escapeHTML(product.name)}">${sizeOptions(item.size)}</select>
<div class="cart-item-controls"><div class="quantity-stepper">
<button type="button" data-action="decrease" aria-label="Decrease quantity for ${escapeHTML(product.name)}"${item.quantity === 1 ? " disabled" : ""}>−</button>
<input type="number" min="1" step="1" value="${item.quantity}" data-action="quantity" aria-label="Quantity for ${escapeHTML(product.name)}">
<button type="button" data-action="increase" aria-label="Increase quantity for ${escapeHTML(product.name)}">+</button>
</div><button class="text-button" type="button" data-action="remove" aria-label="Remove ${escapeHTML(product.name)}, ${item.size}">Remove</button></div></div>
</article>`;
}).join("") : '<div class="empty-cart"><h3>Your next pair awaits.</h3><p>Your cart is empty.</p><button class="button" type="button" data-close="cart-dialog">Explore the Collection</button></div>';
initializeImages(cartItems);
document.querySelector("#cart-subtotal").textContent = cart.length && cart.every((item) => hasPrice(productById(item.id)))
? money(cart.reduce((total, item) => total + productById(item.id).price * item.quantity, 0))
: "Prices confirmed on WhatsApp";
checkoutLink.setAttribute("aria-disabled", String(!cart.length));
if (cart.length) {
checkoutLink.href = whatsappURL(checkoutMessage());
checkoutLink.removeAttribute("tabindex");
} else {
checkoutLink.removeAttribute("href");
checkoutLink.setAttribute("tabindex", "-1");
}
}
function openDialog(dialog) {
dialog.showModal();
document.body.classList.add("dialog-open");
animate(dialog, [
{ opacity: 0, transform: dialog === cartDialog ? "translateX(100%)" : "translateY(24px)" },
{ opacity: 1, transform: "translate(0)" }
], { duration: 360 });
}
const closingDialogs = new WeakSet();
async function closeDialog(dialog) {
if (!dialog.open || closingDialogs.has(dialog)) return;
closingDialogs.add(dialog);
await animate(dialog, [
{ opacity: 1, transform: "translate(0)" },
{ opacity: 0, transform: dialog === cartDialog ? "translateX(100%)" : "translateY(16px)" }
], { duration: 180, easing: "ease-in" });
dialog.close();
closingDialogs.delete(dialog);
}
[detailDialog, cartDialog].forEach((dialog) => {
dialog.addEventListener("keydown", (event) => {
if (event.key !== "Tab") return;
const controls = [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]')]
.filter((control) => control.getClientRects().length && control.getAttribute("aria-disabled") !== "true");
const first = controls[0];
const last = controls[controls.length - 1];
if (event.shiftKey && document.activeElement === first) {
event.preventDefault();
last?.focus();
} else if (!event.shiftKey && document.activeElement === last) {
event.preventDefault();
first?.focus();
}
});
dialog.addEventListener("cancel", (event) => { event.preventDefault(); closeDialog(dialog); });
dialog.addEventListener("close", () => {
if (!document.querySelector("dialog[open]")) document.body.classList.remove("dialog-open");
});
dialog.addEventListener("click", (event) => {
if (event.target.closest("[data-close]")) closeDialog(dialog);
if (event.target === dialog) {
const box = dialog.getBoundingClientRect();
if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog(dialog);
}
});
});
function openDetail(id) {
detailProduct = productById(id);
if (!detailProduct) return;
const product = detailProduct;
document.querySelector("#detail-content").innerHTML = `<div class="detail-layout">
${imageMarkup(product, "detail-image", false)}
<div class="detail-copy"><p class="detail-category">${product.category}</p><h2 id="detail-name">${escapeHTML(product.name)}</h2>
<p class="detail-description">${escapeHTML(product.description)}</p><div class="price-slot">${priceText(product)}</div>
<form id="detail-form"><div class="detail-fields"><div><label class="field-label" for="detail-size">Size</label>
<select id="detail-size" name="size" required aria-describedby="availability-note"><option value="" disabled selected>Choose your size</option>${sizeOptions()}</select></div>
<div><label class="field-label" for="detail-quantity">Quantity</label><input id="detail-quantity" name="quantity" type="number" value="1" min="1" step="1" required></div></div>
<p class="availability-note" id="availability-note">Availability confirmed on WhatsApp.</p>
<button class="button add-button" type="submit">Add to Cart ${arrow}</button>
</form>
<a class="order-link" id="detail-whatsapp" href="${productURL(product)}" target="_blank" rel="noopener noreferrer">Order on WhatsApp ${arrow}</a>
</div></div>`;
initializeImages(document.querySelector("#detail-content"));
openDialog(detailDialog);
}
grid.addEventListener("click", (event) => {
const button = event.target.closest("[data-detail]");
if (button) openDetail(button.dataset.detail);
});
document.querySelector("#detail-content").addEventListener("input", () => {
const size = document.querySelector("#detail-size").value;
const quantity = Number(document.querySelector("#detail-quantity").value);
document.querySelector("#detail-whatsapp").href = SIZES.includes(size) && validQuantity(quantity)
? whatsappURL(`Hello JorSmart Shoes, I'd like to order the ${detailProduct.name}. Size: ${size}. Quantity: ${quantity}. Please confirm availability.`)
: productURL(detailProduct);
});
document.querySelector("#detail-content").addEventListener("submit", (event) => {
event.preventDefault();
const form = event.target;
const size = form.elements.size.value;
const quantity = Number(form.elements.quantity.value);
if (!form.reportValidity() || !SIZES.includes(size) || !validQuantity(quantity)) return;
const existing = cart.find((item) => item.id === detailProduct.id && item.size === size);
if (existing && !validQuantity(existing.quantity + quantity)) return;
if (existing) existing.quantity += quantity;
else cart.push({ id: detailProduct.id, size, quantity });
saveCart();
renderCart();
cartStatus.textContent = `${detailProduct.name}, ${size}, added to your cart.`;
detailDialog.close();
openDialog(cartDialog);
});
cartTrigger.hidden = false;
cartTrigger.addEventListener("click", () => { cartStatus.textContent = ""; openDialog(cartDialog); });
function updateCart(event) {
const control = event.target.closest("[data-action]");
if (!control || (event.type === "click" && !control.matches("button"))) return;
if (event.type === "change" && control.matches("button")) return;
const index = Number(control.closest(".cart-item").dataset.index);
const item = cart[index];
if (!item) return;
const action = control.dataset.action;
let focusIndex = index;
if (action === "remove") {
cart.splice(index, 1);
focusIndex = Math.min(index, cart.length - 1);
} else if (action === "size") {
if (!SIZES.includes(control.value)) return;
const match = cart.find((row) => row !== item && row.id === item.id && row.size === control.value);
if (match) {
if (!validQuantity(match.quantity + item.quantity)) return;
match.quantity += item.quantity;
cart.splice(index, 1);
focusIndex = cart.indexOf(match);
} else item.size = control.value;
} else {
const quantity = action === "increase" ? item.quantity + 1 : action === "decrease" ? item.quantity - 1 : Number(control.value);
if (!validQuantity(quantity)) {
cartStatus.textContent = "Enter a positive whole-number quantity.";
if (control.matches("input")) control.value = item.quantity;
return;
}
item.quantity = quantity;
}
saveCart();
renderCart();
cartStatus.textContent = action === "remove" ? "Item removed from your cart." : "Cart updated.";
const replacement = cartItems.querySelector(`[data-index="${focusIndex}"] [data-action="${action}"]`);
const fallback = cartItems.querySelector(`[data-index="${focusIndex}"] [data-action="quantity"]`) || cartItems.querySelector("button") || cartDialog.querySelector("[data-close]");
(replacement && !replacement.disabled ? replacement : fallback)?.focus({ preventScroll: true });
}
cartItems.addEventListener("click", updateCart);
cartItems.addEventListener("change", updateCart);
checkoutLink.addEventListener("click", (event) => { if (!cart.length) event.preventDefault(); });
window.addEventListener("storage", (event) => {
if (event.key !== CART_KEY && event.key !== null) return;
try { cart = normalizeCart(JSON.parse(event.newValue || "[]")); } catch { cart = []; }
renderCart();
cartStatus.textContent = "Cart updated from another tab.";
});
renderCart();

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const activeAnimations = new Set();
const entranceEase = "cubic-bezier(.16,1,.3,1)";
const animate = (element, frames, options = {}) => {
if (motionPreference.matches || !element.animate) return Promise.resolve();
const animation = element.animate(frames, { duration: 560, easing: entranceEase, ...options });
activeAnimations.add(animation);
return animation.finished.catch(() => {}).finally(() => activeAnimations.delete(animation));
};
const enter = (element, delay = 0) => animate(element, [
{ opacity: 0, transform: "translateY(24px)" },
{ opacity: 1, transform: "translateY(0)" }
], { delay, fill: "backwards" });
const headline = document.querySelector("#hero-title");
if (headline) {
// Wrap the existing lines without changing their text, emphasis or line breaks.
[...headline.childNodes].forEach((node) => {
if (node.nodeName === "BR") return;
const line = document.createElement("span");
line.className = "hero-line";
node.replaceWith(line);
line.append(node);
});
}
document.documentElement.classList.add("motion-enabled");
document.querySelectorAll(".hero-line").forEach((line, index) => enter(line, index * 110));
const heroSubtext = document.querySelector(".hero-copy p");
const heroButton = document.querySelector(".hero-copy .button");
const heroFigure = document.querySelector(".hero-figure");
if (heroSubtext) enter(heroSubtext, 280);
if (heroButton) enter(heroButton, 390);
if (heroFigure) animate(heroFigure, [
{ opacity: 0, transform: "translateY(28px) scale(.975)" },
{ opacity: 1, transform: "translateY(0) scale(1)" }
], { duration: 760, delay: 180, fill: "backwards" });

const filters = document.querySelector(".filters");
const products = [...document.querySelectorAll(".product")];
const resultCount = document.querySelector("#result-count");
let selectedCategory = "All";
let filterRevision = 0;
const cardAnimations = () => products.forEach((product) => product.getAnimations().forEach((animation) => animation.cancel()));
const applyFilter = (category) => {
let visible = 0;
products.forEach((product) => {
product.hidden = category !== "All" && product.dataset.category !== category;
if (!product.hidden) visible += 1;
});
if (resultCount) resultCount.textContent = `${visible} ${visible === 1 ? "style" : "styles"}${category === "All" ? "" : ` · ${category}`}`;
};
let revealObserver;
if ("IntersectionObserver" in window) {
revealObserver = new IntersectionObserver((entries) => {
const arriving = entries.filter((entry) => entry.isIntersecting);
arriving.forEach((entry, index) => {
revealObserver.unobserve(entry.target);
enter(entry.target, entry.target.matches(".product") ? Math.min(index * 65, 195) : 0);
});
}, { threshold: 0.08 });
document.querySelectorAll(".section-heading, #order-title, .product, .order-steps li").forEach((element) => revealObserver.observe(element));
}
if (filters && resultCount) {
filters.hidden = false;
filters.addEventListener("click", async (event) => {
const button = event.target.closest("button[data-filter]");
if (!button || !filters.contains(button) || button.dataset.filter === selectedCategory) return;
selectedCategory = button.dataset.filter;
const revision = ++filterRevision;
filters.querySelectorAll("button").forEach((filter) => filter.setAttribute("aria-pressed", String(filter === button)));
cardAnimations();
products.forEach((product) => revealObserver?.unobserve(product));
if (!motionPreference.matches) {
await Promise.all(products.filter((product) => !product.hidden).map((product) => animate(product, [
{ opacity: 1, transform: "translateY(0)" },
{ opacity: 0, transform: "translateY(10px)" }
], { duration: 160, easing: "ease-in", fill: "forwards" })));
}
if (revision !== filterRevision) return;
cardAnimations();
applyFilter(selectedCategory);
products.filter((product) => !product.hidden).forEach((product, index) => enter(product, Math.min(index * 45, 180)));
});
}

// Duplicate existing category/location wording for a seamless, optional motion strip.
const collection = document.querySelector("#collection");
let marquee;
let marqueeVisible = false;
let marqueePaused = false;
const updateMarquee = () => marquee?.classList.toggle("is-running", marqueeVisible && !marqueePaused && !document.hidden && !motionPreference.matches);
if (collection) {
marquee = document.createElement("div");
marquee.className = "category-marquee";
const phrase = "Dress Shoes · Loafers · Slides · Kumasi, Ghana · ";
marquee.innerHTML = `<div class="marquee-window" aria-hidden="true"><div class="marquee-track"><span class="marquee-copy">${phrase.repeat(3)}</span><span class="marquee-copy">${phrase.repeat(3)}</span></div></div><button class="marquee-toggle" type="button" aria-label="Pause scrolling categories" aria-pressed="false"><svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor"><path d="M4 3h3v10H4zm5 0h3v10H9z"/></svg></button>`;
collection.before(marquee);
const toggle = marquee.querySelector("button");
toggle.addEventListener("click", () => {
marqueePaused = !marqueePaused;
toggle.setAttribute("aria-pressed", String(marqueePaused));
toggle.setAttribute("aria-label", marqueePaused ? "Resume scrolling categories" : "Pause scrolling categories");
toggle.querySelector("path").setAttribute("d", marqueePaused ? "M4 2l9 6-9 6z" : "M4 3h3v10H4zm5 0h3v10H9z");
updateMarquee();
});
if ("IntersectionObserver" in window) {
new IntersectionObserver(([entry]) => {
marqueeVisible = entry.isIntersecting;
updateMarquee();
}).observe(marquee);
}
}
document.addEventListener("visibilitychange", updateMarquee);
motionPreference.addEventListener("change", () => {
if (motionPreference.matches) {
++filterRevision;
activeAnimations.forEach((animation) => animation.cancel());
cardAnimations();
applyFilter(selectedCategory);
}
updateMarquee();
});
const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();
