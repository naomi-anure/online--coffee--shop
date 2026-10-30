const navbar = document.querySelector('.navbar');
const searchForm = document.querySelector('#search-form');
const cartContainer = document.querySelector('.cart-items-container');
const cartList = document.querySelector('.cart-list');
const totalPriceElement = document.querySelector('#total-price');
const searchBox = document.querySelector('#search-box');
const cartBadge = document.querySelector('#cart-badge');
const toastContainer = document.querySelector('#toast-container');
const contactForm = document.querySelector('#contact-form');

const searchModal = document.querySelector('#search-modal');
const searchResultsContainer = document.querySelector('#search-results-container');
const closeSearchModalBtn = document.querySelector('.close-search-modal');

const menuBtn = document.querySelector('#menu-btn');
const searchBtn = document.querySelector('#search-btn');
const cartBtn = document.querySelector('#cart-btn');
const checkoutBtn = document.querySelector('.checkout-btn') || document.querySelector('#checkout-btn');

// --- State Management with LocalStorage ---
let cart = JSON.parse(localStorage.getItem('coffee_cart')) || [];

// --- Navigation Toggle Logic ---
if (menuBtn) {
    menuBtn.onclick = () => {
        navbar.classList.toggle('active');
        searchForm.classList.remove('active');
        cartContainer.classList.remove('active');
    };
}

if (searchBtn) {
    searchBtn.onclick = () => {
        searchForm.classList.toggle('active');
        navbar.classList.remove('active');
        cartContainer.classList.remove('active');
        searchBox.focus();
    };
}

if (cartBtn) {
    cartBtn.onclick = () => {
        cartContainer.classList.toggle('active');
        navbar.classList.remove('active');
        searchForm.classList.remove('active');
    };
}

window.onscroll = () => {
    if (navbar) navbar.classList.remove('active');
    if (searchForm) searchForm.classList.remove('active');
    if (cartContainer) cartContainer.classList.remove('active');
};

// --- Compact Live Search Modal Logic ---
function executeSearch() {
    const filterValue = searchBox.value.toLowerCase().trim();
    const menuAndProductBoxes = document.querySelectorAll('.menu .box, .product .box');

    // Keep all menu sections fully visible in the background
    menuAndProductBoxes.forEach(item => item.style.display = '');

    if (!filterValue) {
        if (searchModal) searchModal.classList.remove('active');
        return;
    }

    // Collect matching items
    const matches = [];
    menuAndProductBoxes.forEach(box => {
        const heading = box.querySelector('h3');
        if (heading && heading.textContent.toLowerCase().includes(filterValue)) {
            const name = heading.textContent;
            const priceElement = box.querySelector('.price');
            const priceText = priceElement ? priceElement.childNodes[0].textContent : '0';
            const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10) || 0;
            
            const imgElement = box.querySelector('img') || box.querySelector('.image img');
            const imgSrc = imgElement ? imgElement.src : '';

            if (!matches.some(m => m.name === name)) {
                matches.push({ name, price, imgSrc });
            }
        }
    });

    // Populate Compact Popup Results
    if (searchResultsContainer) {
        searchResultsContainer.innerHTML = '';

        if (matches.length > 0) {
            matches.forEach(item => {
                const cardHTML = `
                    <div class="search-card">
                        <div class="card-left">
                            <img src="${item.imgSrc}" alt="${item.name}">
                            <div>
                                <h3>${item.name}</h3>
                                <div class="price">#${item.price.toLocaleString()}</div>
                            </div>
                        </div>
                        <button class="btn modal-add-btn" data-name="${item.name}" data-price="${item.price}" data-img="${item.imgSrc}">+ Cart</button>
                    </div>
                `;
                searchResultsContainer.insertAdjacentHTML('beforeend', cardHTML);
            });
        } else {
            searchResultsContainer.innerHTML = '<p style="color: white; font-size: 1.4rem; text-align: center; padding: 1rem;">No matching items found.</p>';
        }
    }

    if (searchModal) searchModal.classList.add('active');
}

// Add to Cart and Auto-Close Popup
if (searchResultsContainer) {
    searchResultsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-add-btn')) {
            const name = e.target.getAttribute('data-name');
            const price = parseInt(e.target.getAttribute('data-price'), 10);
            const imgSrc = e.target.getAttribute('data-img');

            // Add item to cart
            addToCart(name, price, imgSrc);

            // Instantly hide the search popup and close the search bar
            if (searchModal) searchModal.classList.remove('active');
            if (searchForm) searchForm.classList.remove('active');
            if (searchBox) searchBox.value = '';
        }
    });
}

// Close search modal handlers
if (closeSearchModalBtn) {
    closeSearchModalBtn.onclick = () => {
        if (searchModal) searchModal.classList.remove('active');
    };
}

if (searchBox) {
    searchBox.addEventListener('input', executeSearch);
}

if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        executeSearch();
    });
}

// --- Toast Notifications ---
function showToast(message) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// --- Cart Actions ---
document.addEventListener('click', (e) => {
    // Menu item "Add to cart" button
    if (e.target.classList.contains('btn') && e.target.closest('.menu .box')) {
        e.preventDefault();
        const box = e.target.closest('.box');
        const name = box.querySelector('h3').textContent;
        const priceText = box.querySelector('.price').childNodes[0].textContent;
        const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10) || 0;
        const imgSrc = box.querySelector('img').src;

        addToCart(name, price, imgSrc);
    }

    // Product item shopping cart icon
    if (e.target.classList.contains('fa-shopping-cart') && e.target.closest('.product .box')) {
        e.preventDefault();
        const box = e.target.closest('.box');
        const name = box.querySelector('h3').textContent;
        const priceText = box.querySelector('.price').childNodes[0].textContent;
        const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10) || 0;
        const imgSrc = box.querySelector('.image img').src;

        addToCart(name, price, imgSrc);
    }
});

function addToCart(name, price, imgSrc) {
    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, imgSrc, quantity: 1 });
    }

    saveCart();
    updateCartUI();
    showToast(`${name} added to cart!`);
}

// Attached to window so HTML inline onclick events can access it globally
window.removeFromCart = function(name) {
    cart = cart.filter(item => item.name !== name);
    saveCart();
    updateCartUI();
    showToast(`${name} removed from cart`);
};

function saveCart() {
    localStorage.setItem('coffee_cart', JSON.stringify(cart));
}

function updateCartUI() {
    if (!cartList) return;
    cartList.innerHTML = '';

    // Update Counter Badge
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartBadge) cartBadge.textContent = totalCount;

    if (cart.length === 0) {
        cartList.innerHTML = '<p style="font-size: 1.6rem; color: #13131A; text-align: center; padding: 2rem;">Your cart is empty.</p>';
        if (totalPriceElement) totalPriceElement.textContent = '#0';
        return;
    }

    let grandTotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        grandTotal += itemTotal;

        const cartItemHTML = `
            <div class="cart-item">
                <span class="fas fa-times" onclick="removeFromCart('${item.name}')"></span>
                <img src="${item.imgSrc}" alt="${item.name}">
                <div class="content">
                    <h3>${item.name} (${item.quantity}x)</h3>
                    <div class="price">#${itemTotal.toLocaleString()}</div>
                </div>
            </div>
        `;
        cartList.insertAdjacentHTML('beforeend', cartItemHTML);
    });

    if (totalPriceElement) totalPriceElement.textContent = `#${grandTotal.toLocaleString()}`;
}

// --- Paystack Payment Gateway Integration with Dashboard Metadata ---
window.payWithPaystack = function(e) {
    if (e) e.preventDefault();

    if (cart.length === 0) {
        showToast('Your cart is empty!');
        return;
    }

    const grandTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const customerEmail = prompt("Please enter your email address to proceed with payment:");
    
    if (!customerEmail || !customerEmail.includes('@')) {
        showToast('Valid email required for payment receipt.');
        return;
    }

    if (typeof PaystackPop === 'undefined') {
        showToast('Paystack script failed to load. Check ad-blockers.');
        console.error('PaystackPop is not defined. Check if an extension is blocking js.paystack.co');
        return;
    }

    // Prepare item breakdown for Paystack Dashboard
    const itemDetails = cart.map(item => `${item.name} (Qty: ${item.quantity}) - #${(item.price * item.quantity).toLocaleString()}`).join(', ');
    const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handler = PaystackPop.setup({
        key: 'pk_test_eb745de41d63f1d29266885468be44a264ca9ec4',
        email: customerEmail,
        amount: grandTotal * 100, // Amount in kobo
        currency: 'NGN',
        ref: 'COFFEE_ORDER_' + Math.floor((Math.random() * 1000000000) + 1),
        
        // Metadata renders these custom fields inside your Paystack Dashboard
        metadata: {
            custom_fields: [
                {
                    display_name: "Ordered Items",
                    variable_name: "ordered_items",
                    value: itemDetails
                },
                {
                    display_name: "Total Items Count",
                    variable_name: "total_items_count",
                    value: totalUnits.toString()
                },
                {
                    display_name: "Order Source",
                    variable_name: "order_source",
                    value: "Coffee Website Storefront"
                }
            ]
        },

        onClose: function() {
            showToast('Transaction cancelled.');
        },
        
        callback: function(response) {
            showToast('Payment successful! Ref: ' + response.reference);
            cart = [];
            saveCart();
            updateCartUI();
            if (cartContainer) cartContainer.classList.remove('active');
        }
    });

    handler.openIframe();
}

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', payWithPaystack);
}

// --- Contact Form Handling ---
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.querySelector('#contact-name');
        const name = nameInput ? nameInput.value : 'Customer';
        showToast(`Thank you, ${name}! Your message has been sent.`);
        contactForm.reset();
    });
}

// Render cart on initial load
updateCartUI();