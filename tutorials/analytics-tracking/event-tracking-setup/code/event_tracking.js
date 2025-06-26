// Example Data Layer (window.dataLayer)
window.dataLayer = window.dataLayer || [];

function pushToDataLayer(eventName, eventProperties) {
    window.dataLayer.push({
        event: eventName,
        ...eventProperties
    });
}

// Example usage:
pushToDataLayer('product_view', {
    product_id: 'SKU123',
    product_name: 'Awesome Widget',
    category: 'Electronics',
    price: 99.99
});

// Track a button click
document.getElementById('add-to-cart-btn').addEventListener('click', function() {
    pushToDataLayer('add_to_cart', {
        product_id: 'SKU123',
        product_name: 'Awesome Widget',
        quantity: 1,
        price: 99.99
    });
});

// Track a form submission
document.getElementById('signup-form').addEventListener('submit', function() {
    pushToDataLayer('signup_completed', {
        user_email: 'user@example.com',
        signup_method: 'email_password'
    });
});
