// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Cart State
let selectedItems = [];

// Dynamic Collections from Firestore
function renderFilters() {
    const filterContainer = document.getElementById('dynamic-filters');
    if (!filterContainer) return;

    collectionsRef.doc('main').onSnapshot(doc => {
        if (!doc.exists) {
            // Seed default if empty
            collectionsRef.doc('main').set({ list: ["Chairs", "Beds", "Dining"] });
            return;
        }

        const collections = doc.data().list;
        filterContainer.innerHTML = `<button class="filter-btn active" onclick="filterItems('all')">All</button>` +
            collections.map(cat => `
                <button class="filter-btn" onclick="filterItems('${cat.toLowerCase()}')">${cat}</button>
            `).join('');
    });
}

// Filtering Logic
function filterItems(category) {
    const cards = document.querySelectorAll('.product-card');
    const btns = document.querySelectorAll('.filter-btn');

    btns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.toLowerCase() === category.toLowerCase()) btn.classList.add('active');
    });

    cards.forEach(card => {
        const itemCat = card.getAttribute('data-category').toLowerCase();
        if (category === 'all' || itemCat === category.toLowerCase()) {
            card.style.display = 'block';
            setTimeout(() => card.style.opacity = '1', 10);
        } else {
            card.style.opacity = '0';
            setTimeout(() => card.style.display = 'none', 400);
        }
    });
}

// Item Selection Logic
function selectItem(name, category, image) {
    if (selectedItems.find(i => i.name === name)) {
        alert('Item already in selection');
        return;
    }

    // For default items where image might be missing from call
    if (!image) {
        const card = Array.from(document.querySelectorAll('.product-card')).find(c => c.querySelector('h3').innerText === name);
        image = card ? card.querySelector('img').src : '';
    }

    selectedItems.push({ name, category, image, note: '', id: Date.now() });
    updateCartUI();

    const cartIcon = document.getElementById('cart-fixed');
    cartIcon.style.transform = 'scale(1.2)';
    setTimeout(() => cartIcon.style.transform = 'scale(1)', 200);
}

function updateCartUI() {
    const count = document.getElementById('cart-count');
    if (count) count.textContent = selectedItems.length;
}

function openSelectionModal() {
    if (selectedItems.length === 0) {
        alert('Please select at least one item first.');
        return;
    }

    const modal = document.getElementById('selection-modal');
    renderCartItems();

    document.getElementById('modal-step-1').style.display = 'block';
    document.getElementById('modal-step-2').style.display = 'none';
    modal.style.display = 'block';
    document.getElementById('whatsapp-btn').style.display = 'none';
}

function renderCartItems() {
    const list = document.getElementById('cart-items-list');
    list.innerHTML = selectedItems.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <img src="${item.image}" class="cart-item-thumb">
                <div class="cart-item-main">
                    <h4>${item.name}</h4>
                    <p>${item.category}</p>
                    <textarea class="adjustment-note" placeholder="Specific adjustments? (e.g. dimensions, color)" onchange="updateNote(${item.id}, this.value)">${item.note}</textarea>
                </div>
            </div>
            <button class="remove-item" onclick="removeItem(${item.id})">Remove</button>
        </div>
    `).join('');
}

function updateNote(id, note) {
    selectedItems = selectedItems.map(i => i.id === id ? { ...i, note } : i);
}

function removeItem(id) {
    selectedItems = selectedItems.filter(i => i.id !== id);
    updateCartUI();
    if (selectedItems.length === 0) {
        closeModal();
    } else {
        renderCartItems();
    }
}

function submitSelection() {
    const customerName = document.getElementById('customer-name').value;
    const customerPhone = document.getElementById('customer-phone').value;
    if (!customerName || !customerPhone) {
        alert('Please enter both your name and phone number');
        return;
    }

    const selection = {
        items: selectedItems,
        customerName,
        customerPhone,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending'
    };

    inquiriesRef.add(selection).then(() => {
        document.getElementById('modal-step-1').style.display = 'none';
        document.getElementById('modal-step-2').style.display = 'block';
        document.getElementById('confirmed-customer-name').textContent = customerName;
        document.getElementById('whatsapp-btn').style.display = 'block';
    }).catch(err => {
        console.error("Error saving selection:", err);
        alert("Failed to save selection. Please try again.");
    });
}

function contactWhatsApp() {
    const customerName = document.getElementById('customer-name').value;
    const customerPhone = document.getElementById('customer-phone').value;
    const itemsList = selectedItems.map((item, index) => {
        let text = `${index + 1}. ${item.name} (${item.category})`;
        if (item.note) text += `%0A   - Note: ${item.note}`;
        return text;
    }).join('%0A%0A');

    // Fetch WA Number from Firestore
    settingsRef.doc('admin').get().then(doc => {
        const waNumber = (doc.exists && doc.data().waNumber) ? doc.data().waNumber : '1234567890';
        const message = `Hello! I am ${customerName} (${customerPhone}).%0AI am interested in the following pieces from rep al & m:%0A%0A${itemsList}%0A%0APlease let me know the next steps.`;
        window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
    });
}

function closeModal() {
    const modal = document.getElementById('selection-modal');
    modal.style.display = 'none';
    if (document.getElementById('modal-step-2').style.display === 'block') {
        selectedItems = [];
        updateCartUI();
    }
}

function loadCustomFurniture() {
    const grid = document.querySelector('.showroom-grid');
    if (!grid) return;

    // Real-time listener for custom furniture
    furnitureRef.orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        // Remove existing custom items to avoid duplicates on update
        document.querySelectorAll('.product-card.custom-item').forEach(el => el.remove());

        snapshot.forEach(doc => {
            const item = doc.data();
            const card = document.createElement('div');
            card.className = 'product-card custom-item fade-in';
            card.setAttribute('data-category', item.cat);

            card.innerHTML = `
                <div class="product-image">
                    <img src="${item.image}" alt="${item.name}">
                    <button class="select-btn" onclick="selectItem('${item.name}', '${item.cat}', '${item.image}')">Select Item</button>
                </div>
                <div class="product-info">
                    <h3>${item.name}</h3>
                    <p>${item.desc}</p>
                </div>
            `;
            grid.prepend(card);
        });
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCustomFurniture();
    renderFilters();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.product-card').forEach(card => {
        observer.observe(card);

        // Ensure static cards have image in selectItem call
        const btn = card.querySelector('.select-btn');
        if (btn && !btn.getAttribute('onclick').includes('image')) {
            const name = card.querySelector('h3').innerText;
            const cat = card.getAttribute('data-category');
            const img = card.querySelector('img').src;
            btn.setAttribute('onclick', `selectItem('${name}', '${cat}', '${img}')`);
        }
    });

    // Update Connect button with dynamic WA number
    settingsRef.doc('admin').get().then(doc => {
        const waNumber = (doc.exists && doc.data().waNumber) ? doc.data().waNumber : '1234567890';
        document.querySelectorAll('.btn-primary').forEach(btn => {
            if (btn.innerText.toLowerCase() === 'connect') {
                btn.href = `https://wa.me/${waNumber}?text=Hello! I'd like to inquire about your interior services.`;
                btn.target = "_blank";
            }
        });
    });
});
