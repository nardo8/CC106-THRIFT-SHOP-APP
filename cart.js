// Initialize Supabase client
const supabaseUrl = 'https://egnxlyydywpmllfnafnk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbnhseXlkeXdwbWxsZm5hZm5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTMzMDIsImV4cCI6MjA2MzQ4OTMwMn0.-ukPGzSlSPCk792kRqxZghELfctMjQe5i40r-mdpt1w';
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to add item to cart in Supabase
async function addToCart(item) {
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        if (!user) {
            alert('Please login to add items to cart');
            window.location.href = 'index.html';
            return;
        }

        console.log('Adding item to cart:', item);

        // Check if item already exists in cart
        const { data: existingItems, error: fetchError } = await supabase
            .from('cart')
            .select('*')
            .eq('user_id', user.id)
            .eq('item_name', item.name)
            .eq('category', item.category);

        if (fetchError) throw fetchError;

        console.log('Existing items found:', existingItems);

        if (existingItems && existingItems.length > 0) {
            // Update quantity of existing item
            const existingItem = existingItems[0];
            const newQuantity = existingItem.quantity + item.quantity;
            console.log('Updating quantity from', existingItem.quantity, 'to', newQuantity);

            const { data, error } = await supabase
                .from('cart')
                .update({ quantity: newQuantity })
                .eq('id', existingItem.id)
                .select(); // Add select() to get the updated record

            if (error) throw error;
            console.log('Updated cart item:', data);
        } else {
            // Add new item to cart
            const { data, error } = await supabase
                .from('cart')
                .insert([
                    {
                        user_id: user.id,
                        item_name: item.name,
                        item_price: item.price,
                        quantity: item.quantity,
                        category: item.category,
                        image_url: item.image,
                        created_at: new Date().toISOString()
                    }
                ])
                .select(); // Add select() to get the inserted record

            if (error) throw error;
            console.log('Added new cart item:', data);
        }

        return true;
    } catch (error) {
        console.error('Error adding item to cart:', error.message);
        alert('Failed to add item to cart. Please try again.');
        return false;
    }
}

// Function to get cart items for current user
async function getCartItems() {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        if (!user) {
            return [];
        }

        const { data, error } = await supabase
            .from('cart')
            .select('*')
            .eq('user_id', user.id);

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error fetching cart items:', error.message);
        return [];
    }
}

// Function to update cart item quantity
async function updateCartItemQuantity(itemId, quantity) {
    try {
        const { data, error } = await supabase
            .from('cart')
            .update({ quantity })
            .eq('id', itemId);

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error updating cart item:', error.message);
        alert('Failed to update cart item. Please try again.');
    }
}

// Function to remove item from cart
async function removeFromCart(itemId) {
    try {
        const { error } = await supabase
            .from('cart')
            .delete()
            .eq('id', itemId);

        if (error) throw error;

        alert('Item removed from cart successfully!');
    } catch (error) {
        console.error('Error removing item from cart:', error.message);
        alert('Failed to remove item from cart. Please try again.');
    }
}

// Function to clear cart
async function clearCart() {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const { error } = await supabase
            .from('cart')
            .delete()
            .eq('user_id', user.id);

        if (error) throw error;

        alert('Cart cleared successfully!');
    } catch (error) {
        console.error('Error clearing cart:', error.message);
        alert('Failed to clear cart. Please try again.');
    }
}

// Function to calculate total price with discount
function calculateTotal(items, withDiscount = true) {
    const subtotal = items.reduce((total, item) => {
        const itemPrice = parseFloat(item.item_price || item.price || 0);
        const quantity = parseInt(item.quantity || 1);
        return total + (itemPrice * quantity);
    }, 0);
    
    return withDiscount ? subtotal * 0.8 : subtotal; // Apply 20% discount if withDiscount is true
}

// Function to prepare purchase details
function preparePurchaseDetails(items) {
    const itemsWithPrices = items.map(item => {
        const originalPrice = parseFloat(item.item_price || item.price || 0) * (parseInt(item.quantity || 1));
        const discountedPrice = originalPrice * 0.8; // 20% discount
        return {
            ...item,
            item_name: item.item_name || item.name,
            item_price: parseFloat(item.item_price || item.price || 0),
            image_url: item.image_url || item.image,
            quantity: parseInt(item.quantity || 1),
            originalTotal: originalPrice,
            discountedTotal: discountedPrice
        };
    });

    const totalOriginal = itemsWithPrices.reduce((sum, item) => sum + item.originalTotal, 0);
    const totalDiscounted = itemsWithPrices.reduce((sum, item) => sum + item.discountedTotal, 0);

    return {
        items: itemsWithPrices,
        totalOriginal: totalOriginal.toFixed(2),
        totalDiscounted: totalDiscounted.toFixed(2),
        discount: '20%'
    };
}

// Function to add item to purchase list
async function addToPurchase(items) {
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        if (!user) {
            alert('Please login to make a purchase');
            window.location.href = 'index.html';
            return;
        }

        // Convert single item to array if necessary
        const itemsArray = Array.isArray(items) ? items : [items];
        
        // Prepare purchase details
        const purchaseDetails = preparePurchaseDetails(itemsArray);
        
        // Save to localStorage for purchase page
        localStorage.setItem('purchaseDetails', JSON.stringify(purchaseDetails));
        
        return true;
    } catch (error) {
        console.error('Error preparing purchase:', error.message);
        alert('Failed to process purchase. Please try again.');
        return false;
    }
}

// Function to get purchase items
function getPurchaseItems() {
    const purchaseDetails = localStorage.getItem('purchaseDetails');
    return purchaseDetails ? JSON.parse(purchaseDetails).items : [];
}

// Function to clear purchase details
function clearPurchaseDetails() {
    localStorage.removeItem('purchaseDetails');
}