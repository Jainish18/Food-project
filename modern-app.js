// Global variables
let currentUser = null
let foods = []
let orders = []
let users = []
let currentFilter = "all"
let searchTimeout = null
let currentTheme = "light" // Default theme
let userCredits = 500 // Starting credits
let promoCodeApplied = false
let cart = [] // Shopping cart
let favorites = [] // Favorite items
let notifications = [] // User notifications
let addresses = [] // User addresses
let paymentMethods = [] // User payment methods
let currentSlide = 0 // Current banner slide

// DOM Elements - cached for performance
const DOM = {
  // Screens
  authScreen: document.getElementById("auth-screen"),
  mainApp: document.getElementById("main-app"),
  homeScreen: document.getElementById("home-screen"),
  searchScreen: document.getElementById("search-screen"),
  ordersScreen: document.getElementById("orders-screen"),
  profileScreen: document.getElementById("profile-screen"),

  // Forms
  authForm: document.getElementById("auth-form"),
  orderForm: document.getElementById("order-form"),

  // Containers
  foodGrid: document.getElementById("food-grid"),
  searchResults: document.getElementById("search-results"),
  ordersContainer: document.getElementById("orders-container"),

  // Inputs
  searchInput: document.getElementById("search-input"),

  // Modals
  orderModal: document.getElementById("order-modal"),
  orderSuccessModal: document.getElementById("order-success-modal"),
  cartModal: document.getElementById("cart-modal"),
  notificationsModal: document.getElementById("notifications-modal"),
  addressModal: document.getElementById("address-modal"),
  paymentModal: document.getElementById("payment-modal"),
  favoritesModal: document.getElementById("favorites-modal"),
  settingsModal: document.getElementById("settings-modal"),
  helpModal: document.getElementById("help-modal"),

  // Navigation
  navItems: document.querySelectorAll(".nav-item"),

  // Profile elements
  profileName: document.getElementById("profile-name"),
  profileEmail: document.getElementById("profile-email"),
  profilePhone: document.getElementById("profile-phone"),
}

// Initialize app
function initializeApp() {
  console.log("Initializing app...")

  // Load data from localStorage
  loadData()

  // Check if user is logged in
  checkAuth()

  // Set up event listeners
  setupEventListeners()

  // Display initial data
  if (currentUser) {
    displayFoodItems()
    displayOrders()
    updateProfileInfo()
    updateCartBadge()
  }

  // Initialize ads banner
  initAdsBanner()

  // Initialize default notifications
  initDefaultNotifications()

  console.log("App initialized successfully")
}

// Initialize ads banner
function initAdsBanner() {
  // Start auto-sliding
  setInterval(() => {
    nextAdsSlide()
  }, 5000)
}

// Next ads slide
function nextAdsSlide() {
  const slides = document.getElementById("ads-slides")
  const indicators = document.querySelectorAll(".ads-indicator")

  if (!slides || !indicators.length) return

  currentSlide = (currentSlide + 1) % indicators.length

  // Update slide position
  slides.style.transform = `translateX(-${currentSlide * 100}%)`

  // Update indicators
  indicators.forEach((indicator, index) => {
    indicator.classList.toggle("active", index === currentSlide)
  })
}

// Initialize default notifications
function initDefaultNotifications() {
  if (notifications.length === 0) {
    notifications = [
      {
        id: 1,
        title: "Welcome to FoodGiver!",
        message: "Enjoy your first order with 20% off using code WELCOME",
        time: new Date().toISOString(),
        read: false,
      },
      {
        id: 2,
        title: "New Menu Items",
        message: "Check out our new menu items in the Popular category",
        time: new Date().toISOString(),
        read: false,
      },
    ]

    // Save to localStorage
    localStorage.setItem("notifications", JSON.stringify(notifications))

    // Update notification badge
    updateNotificationBadge()
  }
}

// Load data from localStorage
function loadData() {
  try {
    // Load foods data
    const storedFoods = localStorage.getItem("foods")
    foods = storedFoods ? JSON.parse(storedFoods) : foodItems

    // If no foods in storage, initialize with default data
    if (!storedFoods) {
      localStorage.setItem("foods", JSON.stringify(foods))
    }

    // Load orders data
    orders = JSON.parse(localStorage.getItem("orders") || "[]")

    // Load users data
    users = JSON.parse(localStorage.getItem("users") || "[]")

    // Load current user
    const storedUser = localStorage.getItem("currentUser")
    currentUser = storedUser ? JSON.parse(storedUser) : null

    // Load user credits
    if (currentUser && localStorage.getItem(`credits_${currentUser.id}`)) {
      userCredits = Number.parseInt(localStorage.getItem(`credits_${currentUser.id}`)) || 500
    }

    // Load cart
    cart = JSON.parse(localStorage.getItem("cart") || "[]")

    // Load favorites
    favorites = JSON.parse(localStorage.getItem("favorites") || "[]")

    // Load notifications
    notifications = JSON.parse(localStorage.getItem("notifications") || "[]")

    // Load addresses
    addresses = JSON.parse(localStorage.getItem("addresses") || "[]")

    // Load payment methods
    paymentMethods = JSON.parse(localStorage.getItem("paymentMethods") || "[]")

    console.log("Data loaded successfully")
  } catch (error) {
    console.error("Error loading data:", error)
    // Initialize with default values if error occurs
    foods = foodItems
    orders = []
    users = []
    currentUser = null
    cart = []
    favorites = []
    notifications = []
    addresses = []
    paymentMethods = []
  }
}

// Set up event listeners
function setupEventListeners() {
  // Auth form submission
  if (DOM.authForm) {
    DOM.authForm.addEventListener("submit", handleAuth)
  }

  // Search input
  if (DOM.searchInput) {
    DOM.searchInput.addEventListener("input", debounceSearch)
  }

  // Order quantity change
  const orderQuantity = document.getElementById("order-quantity")
  if (orderQuantity) {
    orderQuantity.addEventListener("input", updateOrderTotal)
  }

  // Category filter buttons
  document.querySelectorAll('.chip[onclick*="filterByCategory"]').forEach((button) => {
    const category = button.getAttribute("onclick").match(/'([^']+)'/)[1]
    button.onclick = () => filterByCategory(category)
  })

  // Navigation buttons
  document.querySelectorAll(".nav-item").forEach((item) => {
    const screenId = item.getAttribute("onclick").match(/'([^']+)'/)[1]
    item.onclick = () => showScreen(screenId)
  })

  // Logout button
  const logoutButton = document.querySelector(".logout-button")
  if (logoutButton) {
    logoutButton.addEventListener("click", handleLogout)
  }

  // Theme toggle
  const themeToggle = document.getElementById("theme-toggle")
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme)
  }

  // Notifications button
  const notificationsButton = document.getElementById("notifications-button")
  if (notificationsButton) {
    notificationsButton.addEventListener("click", showNotificationsModal)
  }

  // Dark mode toggle in settings
  const darkModeToggle = document.getElementById("dark-mode-toggle")
  if (darkModeToggle) {
    darkModeToggle.addEventListener("change", () => {
      toggleTheme()
    })
  }

  // Ads indicators
  const indicators = document.querySelectorAll(".ads-indicator")
  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", () => {
      currentSlide = index
      const slides = document.getElementById("ads-slides")
      slides.style.transform = `translateX(-${currentSlide * 100}%)`

      // Update indicators
      indicators.forEach((ind, i) => {
        ind.classList.toggle("active", i === currentSlide)
      })
    })
  })

  console.log("Event listeners set up")
}

// Authentication handler
function handleAuth(e) {
  e.preventDefault()

  // Get form values
  const name = document.getElementById("name").value.trim()
  const email = document.getElementById("email").value.trim()
  const phone = document.getElementById("phone").value.trim()

  // Validate inputs
  if (!name || !email || !phone) {
    showToast("Please fill in all fields")
    return
  }

  if (!isValidEmail(email)) {
    showToast("Please enter a valid email address")
    return
  }

  if (!isValidPhone(phone)) {
    showToast("Please enter a valid phone number")
    return
  }

  // Show loading state
  showToast("Logging in...")

  setTimeout(() => {
    // Create user object
    const user = {
      id: Date.now(),
      name: name,
      email: email,
      phone: phone,
      createdAt: new Date().toISOString(),
      level: 1,
      credits: 500,
    }

    // Add to users array
    users.push(user)
    localStorage.setItem("users", JSON.stringify(users))

    // Set as current user
    currentUser = user
    localStorage.setItem("currentUser", JSON.stringify(user))

    // Store credits
    localStorage.setItem(`credits_${user.id}`, user.credits)
    userCredits = user.credits
    updateCreditsDisplay()

    // Show main app
    DOM.authScreen.classList.remove("active")
    DOM.mainApp.classList.add("active")

    // Initialize app data
    displayFoodItems()
    updateProfileInfo()
    initDefaultNotifications()
    updateNotificationBadge()

    console.log("User authenticated:", user.name)
    showToast(`Welcome, ${user.name}!`)
  }, 1000)
}

// Quick login for guest or demo user
function quickLogin(type) {
  let user

  if (type === "guest") {
    user = {
      id: Date.now(),
      name: "Guest User",
      email: "guest@example.com",
      phone: "555-0000",
      createdAt: new Date().toISOString(),
      level: 1,
      credits: 500,
    }
    showToast("Logging in as Guest...")
  } else if (type === "demo") {
    user = {
      id: Date.now(),
      name: "Demo User",
      email: "demo@example.com",
      phone: "555-1234",
      createdAt: new Date().toISOString(),
      level: 2,
      credits: 1000,
    }
    showToast("Logging in with Demo Account...")
  }

  setTimeout(() => {
    // Add to users array
    users.push(user)
    localStorage.setItem("users", JSON.stringify(users))

    // Set as current user
    currentUser = user
    localStorage.setItem("currentUser", JSON.stringify(user))

    // Store credits
    localStorage.setItem(`credits_${user.id}`, user.credits)
    userCredits = user.credits
    updateCreditsDisplay()

    // Show main app
    DOM.authScreen.classList.remove("active")
    DOM.mainApp.classList.add("active")

    // Initialize app data
    displayFoodItems()
    updateProfileInfo()
    initDefaultNotifications()
    updateNotificationBadge()

    console.log("Quick login:", user.name)
    showToast(`Welcome, ${user.name}!`)
  }, 1000)
}

// Check if user is already authenticated
function checkAuth() {
  if (currentUser) {
    DOM.authScreen.classList.remove("active")
    DOM.mainApp.classList.add("active")
    console.log("User already authenticated")

    // Update user stats
    document.getElementById("user-level").textContent = currentUser.level || 1
    updateCreditsDisplay()

    // Count user orders
    const userOrderCount = orders.filter((order) => order.userId === currentUser.id).length
    document.getElementById("user-orders").textContent = userOrderCount

    // Update notification badge
    updateNotificationBadge()
  } else {
    DOM.authScreen.classList.add("active")
    DOM.mainApp.classList.remove("active")
    console.log("No authenticated user found")
  }
}

// Update credits display
function updateCreditsDisplay() {
  document.getElementById("user-credits").textContent = `${userCredits} Credits`
  document.getElementById("user-credits-profile").textContent = userCredits
}

// Update notification badge
function updateNotificationBadge() {
  const unreadCount = notifications.filter((notification) => !notification.read).length
  const badge = document.querySelector("#notifications-button .notification-badge")

  if (badge) {
    badge.textContent = unreadCount
    badge.style.display = unreadCount > 0 ? "flex" : "none"
  }
}

// Update cart badge
function updateCartBadge() {
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const badge = document.getElementById("cart-badge")

  if (badge) {
    badge.textContent = cartCount
    badge.style.display = cartCount > 0 ? "flex" : "none"
  }
}

// Handle logout
function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    showToast("Logging out...")

    setTimeout(() => {
      localStorage.removeItem("currentUser")
      currentUser = null

      DOM.authScreen.classList.add("active")
      DOM.mainApp.classList.remove("active")

      // Reset auth form
      if (DOM.authForm) {
        DOM.authForm.reset()
      }

      console.log("User logged out")
      showToast("Logged out successfully")
    }, 500)
  }
}

// Update profile information
function updateProfileInfo() {
  if (!currentUser) return

  DOM.profileName.textContent = currentUser.name || ""
  DOM.profileEmail.textContent = currentUser.email || ""
  DOM.profilePhone.textContent = currentUser.phone || ""

  // Update user stats
  document.getElementById("user-level").textContent = currentUser.level || 1
  document.getElementById("user-credits-profile").textContent = userCredits

  // Count user orders
  const userOrderCount = orders.filter((order) => order.userId === currentUser.id).length
  document.getElementById("user-orders").textContent = userOrderCount
}

// Create food card element
function createFoodCard(food) {
  const isFavorite = favorites.some((fav) => fav.id === food.id)

  const card = document.createElement("div")
  card.className = "food-card"
  card.innerHTML = `
      <div class="food-image">
          <img src="${food.image}" alt="${food.name}" loading="lazy">
          <span class="category-tag">${food.category}</span>
          <button class="favorite-button ${isFavorite ? "active" : ""}" onclick="toggleFavorite(event, ${food.id})">
              <span class="material-icons-round">${isFavorite ? "favorite" : "favorite_border"}</span>
          </button>
      </div>
      <div class="food-info">
          <h3>${food.name}</h3>
          <p class="price">$${food.price.toFixed(2)}</p>
          <div style="display: flex; gap: 8px; margin-top: auto;">
              <button class="button button-secondary" style="flex: 1;" onclick="addToCart(${food.id})">
                  <span class="material-icons-round">add_shopping_cart</span>
              </button>
              <button class="button button-primary" style="flex: 2;" onclick="showOrderModal(${food.id})">
                  Order Now
              </button>
          </div>
      </div>
  `
  return card
}

// Toggle favorite
function toggleFavorite(event, foodId) {
  event.stopPropagation()

  const food = foods.find((f) => f.id === foodId)
  if (!food) return

  const favoriteIndex = favorites.findIndex((fav) => fav.id === foodId)

  if (favoriteIndex === -1) {
    // Add to favorites
    favorites.push(food)
    showToast(`${food.name} added to favorites`)
  } else {
    // Remove from favorites
    favorites.splice(favoriteIndex, 1)
    showToast(`${food.name} removed from favorites`)
  }

  // Save to localStorage
  localStorage.setItem("favorites", JSON.stringify(favorites))

  // Update UI
  const button = event.currentTarget
  button.classList.toggle("active")
  button.querySelector(".material-icons-round").textContent = button.classList.contains("active")
    ? "favorite"
    : "favorite_border"
}

// Add to cart
function addToCart(foodId) {
  const food = foods.find((f) => f.id === foodId)
  if (!food) return

  // Check if item already in cart
  const cartItemIndex = cart.findIndex((item) => item.id === foodId)

  if (cartItemIndex === -1) {
    // Add new item to cart
    cart.push({
      id: food.id,
      name: food.name,
      price: food.price,
      image: food.image,
      quantity: 1,
    })
  } else {
    // Increment quantity
    cart[cartItemIndex].quantity += 1
  }

  // Save to localStorage
  localStorage.setItem("cart", JSON.stringify(cart))

  // Update cart badge
  updateCartBadge()

  showToast(`${food.name} added to cart`)
}

// Display food items
function displayFoodItems(category = "all") {
  if (!DOM.foodGrid) return

  DOM.foodGrid.innerHTML = ""

  const filteredFoods = category === "all" ? foods : foods.filter((food) => food.category === category)

  if (filteredFoods.length === 0) {
    DOM.foodGrid.innerHTML = `
          <div class="empty-state">
              <span class="material-icons-round">restaurant</span>
              <h3>No items found</h3>
              <p>Try a different category</p>
          </div>
      `
    return
  }

  filteredFoods.forEach((food) => {
    DOM.foodGrid.appendChild(createFoodCard(food))
  })

  console.log(`Displayed ${filteredFoods.length} food items for category: ${category}`)
}

// Filter by category
function filterByCategory(category) {
  currentFilter = category

  // Add transition effect
  DOM.foodGrid.style.opacity = "0.5"
  setTimeout(() => {
    DOM.foodGrid.style.opacity = "1"
  }, 300)

  // Update active state in category chips
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.remove("active")
  })
  document.querySelector(`.chip[onclick*="${category}"]`).classList.add("active")

  // Display filtered items
  displayFoodItems(category)

  // Show toast
  showToast(`Showing ${category} items`)
}

// Debounce search to improve performance
function debounceSearch(e) {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => handleSearch(e), 300)
}

// Search functionality
function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase().trim()
  const searchResults = document.getElementById("search-results")
  const noResults = document.getElementById("no-results")

  if (!searchResults || !noResults) return

  // Add search effect
  searchResults.innerHTML = ""

  if (searchTerm === "") {
    noResults.style.display = "none"
    return
  }

  // Simulate search delay
  setTimeout(() => {
    const filteredFoods = foods.filter(
      (food) => food.name.toLowerCase().includes(searchTerm) || food.category.toLowerCase().includes(searchTerm),
    )

    if (filteredFoods.length === 0) {
      noResults.style.display = "block"
    } else {
      noResults.style.display = "none"
      filteredFoods.forEach((food) => {
        searchResults.appendChild(createFoodCard(food))
      })
    }

    console.log(`Search found ${filteredFoods.length} results for: ${searchTerm}`)
  }, 300)
}

// Display orders
function displayOrders() {
  if (!DOM.ordersContainer) return

  DOM.ordersContainer.innerHTML = ""

  // Filter orders for current user
  const userOrders = orders.filter((order) => currentUser && order.userId === currentUser.id)

  if (userOrders.length === 0) {
    DOM.ordersContainer.innerHTML = `
          <div class="empty-state">
              <span class="material-icons-round">receipt_long</span>
              <h3>No Orders Yet</h3>
              <p>Your order history will appear here</p>
          </div>
      `
    return
  }

  // Sort orders by timestamp (newest first)
  userOrders
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .forEach((order) => {
      DOM.ordersContainer.appendChild(createOrderElement(order))
    })

  console.log(`Displayed ${userOrders.length} orders`)
}

// Filter orders
function filterOrders(filter) {
  if (!DOM.ordersContainer) return

  // Add filter effect
  DOM.ordersContainer.style.opacity = "0.5"

  setTimeout(() => {
    DOM.ordersContainer.innerHTML = ""

    // Filter orders for current user
    let userOrders = orders.filter((order) => currentUser && order.userId === currentUser.id)

    // Apply status filter if not "all"
    if (filter !== "all") {
      userOrders = userOrders.filter((order) => order.status.toLowerCase() === filter)
    }

    if (userOrders.length === 0) {
      DOM.ordersContainer.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons-round">receipt_long</span>
                    <h3>No ${filter} Orders</h3>
                    <p>No orders matching this filter</p>
                </div>
            `
    } else {
      // Sort orders by timestamp (newest first)
      userOrders
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .forEach((order) => {
          DOM.ordersContainer.appendChild(createOrderElement(order))
        })
    }

    // Update active chip
    document.querySelectorAll('.chip[onclick*="filterOrders"]').forEach((chip) => {
      chip.classList.remove("active")
    })
    document.querySelector(`.chip[onclick*="filterOrders('${filter}')"]`).classList.add("active")

    DOM.ordersContainer.style.opacity = "1"

    console.log(`Filtered orders: ${filter}`)
  }, 300)
}

// Create order element
function createOrderElement(order) {
  const div = document.createElement("div")
  div.className = "order-item"

  // Format date for better readability
  const orderDate = new Date(order.timestamp)
  const formattedDate = orderDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  div.innerHTML = `
      <div class="order-header">
          <div class="order-title">
              <span class="order-id">Order #${order.id.toString().slice(-6)}</span>
              <span class="order-status ${order.status.toLowerCase()}">
                  <span class="status-dot"></span>
                  ${order.status}
              </span>
          </div>
          <div class="timestamp">${formattedDate}</div>
      </div>
      <div class="order-content">
          <div class="order-food-details">
              <img src="${order.foodImage}" alt="${order.foodName}" loading="lazy">
              <div class="food-info">
                  <h4>${order.foodName}</h4>
                  <p>Quantity: ${order.quantity}</p>
                  <p class="price">Total: $${order.total.toFixed(2)}</p>
              </div>
          </div>
          <div class="delivery-details">
              <div class="detail-item">
                  <span class="material-icons-round">location_on</span>
                  <p>${order.address}</p>
              </div>
              ${
                order.notes
                  ? `
              <div class="detail-item">
                  <span class="material-icons-round">note</span>
                  <p>${order.notes}</p>
              </div>
              `
                  : ""
              }
              <div class="detail-item">
                  <span class="material-icons-round">local_shipping</span>
                  <p>Delivery Method: ${order.deliveryMethod || "Standard"}</p>
              </div>
          </div>
      </div>
      <button class="button button-primary" style="width: 100%; margin-top: 8px;" onclick="reorderItem(${order.id})">
          <span class="material-icons-round">replay</span>
          Reorder
      </button>
  `
  return div
}

// Reorder item
function reorderItem(orderId) {
  const order = orders.find((o) => o.id === orderId)
  if (!order) return

  const food = foods.find((f) => f.id === order.foodId)
  if (!food) {
    showToast("Sorry, this item is no longer available")
    return
  }

  showOrderModal(food.id)
}

// Show order modal
function showOrderModal(foodId) {
  const food = foods.find((f) => f.id === foodId)
  if (!food) {
    console.error("Food not found:", foodId)
    showToast("Error: Item not found")
    return
  }

  // Set food details in modal
  document.getElementById("order-food-image").src = food.image
  document.getElementById("order-food-name").textContent = food.name
  document.getElementById("order-food-price").textContent = `$${food.price.toFixed(2)}`

  // Pre-fill user information
  if (currentUser) {
    document.getElementById("order-name").value = currentUser.name || ""
    document.getElementById("order-phone").value = currentUser.phone || ""

    // Pre-fill address if available
    if (addresses.length > 0) {
      document.getElementById("order-address").value = addresses[0].address || ""
    }
  }

  // Reset quantity to 1
  document.getElementById("order-quantity").value = 1

  // Reset promo code
  document.getElementById("promo-code").value = ""
  promoCodeApplied = false

  // Store food id in form for reference
  document.getElementById("order-form").dataset.foodId = foodId

  // Show modal
  DOM.orderModal.classList.add("active")

  // Update total price
  updateOrderTotal()

  console.log("Order modal opened for:", food.name)
}

// Apply promo code
function applyPromoCode() {
  const promoCode = document.getElementById("promo-code").value.trim().toUpperCase()

  if (!promoCode) {
    showToast("Please enter a promo code")
    return
  }

  if (promoCode === "WELCOME" && !promoCodeApplied) {
    promoCodeApplied = true
    showToast("Promo code applied: 20% off")
    updateOrderTotal()
  } else if (promoCodeApplied) {
    showToast("Promo code already applied")
  } else {
    showToast("Invalid promo code")
  }
}

// Update order total
function updateOrderTotal() {
  const quantity = Number.parseInt(document.getElementById("order-quantity").value) || 1
  const priceText = document.getElementById("order-food-price").textContent
  const price = Number.parseFloat(priceText.replace("$", "").trim())

  // Get delivery method price adjustment
  let deliveryMultiplier = 1
  const deliveryMethod = document.querySelector('input[name="delivery-method"]:checked').value

  if (deliveryMethod === "express") {
    deliveryMultiplier = 1.2 // 20% extra for express delivery
  } else if (deliveryMethod === "premium") {
    deliveryMultiplier = 1.5 // 50% extra for premium delivery
  }

  let total = quantity * price * deliveryMultiplier

  // Apply promo code if valid
  if (promoCodeApplied) {
    total = total * 0.8 // 20% off
  }

  document.getElementById("order-total-price").textContent = `$${total.toFixed(2)}`
}

// Place order
function placeOrder() {
  // Get form values
  const foodId = Number.parseInt(document.getElementById("order-form").dataset.foodId)
  const quantity = Number.parseInt(document.getElementById("order-quantity").value) || 1
  const name = document.getElementById("order-name").value.trim()
  const phone = document.getElementById("order-phone").value.trim()
  const address = document.getElementById("order-address").value.trim()
  const notes = document.getElementById("order-notes").value.trim()
  const deliveryMethod = document.querySelector('input[name="delivery-method"]:checked').value

  // Validate inputs
  if (!name || !phone || !address) {
    showToast("Please complete all required fields")
    return
  }

  if (!isValidPhone(phone)) {
    showToast("Please enter a valid phone number")
    return
  }

  // Get food details
  const food = foods.find((f) => f.id === foodId)
  if (!food) {
    showToast("Error: Item not found")
    return
  }

  // Calculate total with delivery method adjustment
  let deliveryMultiplier = 1
  if (deliveryMethod === "express") {
    deliveryMultiplier = 1.2 // 20% extra for express delivery
  } else if (deliveryMethod === "premium") {
    deliveryMultiplier = 1.5 // 50% extra for premium delivery
  }

  let total = food.price * quantity * deliveryMultiplier

  // Apply promo code if valid
  if (promoCodeApplied) {
    total = total * 0.8 // 20% off
  }

  // Check if user has enough credits
  if (userCredits < total) {
    showToast("Insufficient credits")
    return
  }

  // Deduct credits
  userCredits -= total
  localStorage.setItem(`credits_${currentUser.id}`, userCredits)
  updateCreditsDisplay()

  // Create order object
  const order = {
    id: Date.now(),
    userId: currentUser ? currentUser.id : null,
    timestamp: new Date().toISOString(),
    foodId: food.id,
    foodName: food.name,
    foodImage: food.image,
    quantity: quantity,
    price: food.price,
    total: total,
    status: "Pending",
    name: name,
    phone: phone,
    address: address,
    notes: notes,
    deliveryMethod: deliveryMethod,
  }

  // Add to orders array
  orders.push(order)
  localStorage.setItem("orders", JSON.stringify(orders))

  // Save address if new
  if (!addresses.some((a) => a.address === address)) {
    addresses.push({
      id: Date.now(),
      address: address,
      default: addresses.length === 0,
    })
    localStorage.setItem("addresses", JSON.stringify(addresses))
  }

  // Close order modal
  closeOrderModal()

  // Show success modal
  showOrderSuccessModal(order)

  // Update orders display
  displayOrders()

  // Update order count in profile
  const userOrderCount = orders.filter((order) => order.userId === currentUser.id).length
  document.getElementById("user-orders").textContent = userOrderCount

  // Level up user if needed (every 5 orders)
  if (userOrderCount % 5 === 0) {
    currentUser.level = (currentUser.level || 1) + 1
    localStorage.setItem("currentUser", JSON.stringify(currentUser))
    document.getElementById("user-level").textContent = currentUser.level
    showToast(`Level up! You are now level ${currentUser.level}`)
  }

  // Add notification
  addNotification("Order Placed", `Your order for ${food.name} has been placed successfully!`)

  console.log("Order placed successfully:", order)
}

// Close order modal
function closeOrderModal() {
  DOM.orderModal.classList.remove("active")
  document.getElementById("order-form").reset()
}

// Show order success modal
function showOrderSuccessModal(order) {
  // Format order ID for display (last 6 digits)
  const displayOrderId = order.id.toString().slice(-6)

  // Set order details in success modal
  document.getElementById("success-order-id").textContent = `Order #${displayOrderId}`
  document.getElementById("success-order-items").textContent = `${order.quantity}x ${order.foodName}`
  document.getElementById("success-order-total").textContent = `Total: $${order.total.toFixed(2)}`
  document.getElementById("success-order-name").textContent = order.name
  document.getElementById("success-order-phone").textContent = order.phone
  document.getElementById("success-order-address").textContent = order.address
  document.getElementById("success-delivery-method").textContent = `Delivery Method: ${order.deliveryMethod}`

  // Show modal
  DOM.orderSuccessModal.classList.add("active")

  // Add animation to tracking progress
  document.getElementById("tracking-progress").style.animation = "progress-pulse 2s infinite"
}

// Close order success modal
function closeOrderSuccessModal() {
  DOM.orderSuccessModal.classList.remove("active")

  // Navigate to orders screen
  showScreen("orders")
}

// Show cart modal
function showCartModal() {
  const cartItemsContainer = document.getElementById("cart-items")
  const emptyCart = document.getElementById("empty-cart")
  const checkoutButton = document.getElementById("checkout-button")

  if (!cartItemsContainer || !emptyCart || !checkoutButton) return

  // Clear previous items
  cartItemsContainer.innerHTML = ""

  if (cart.length === 0) {
    emptyCart.style.display = "flex"
    checkoutButton.disabled = true
    document.getElementById("cart-total").textContent = "$0.00"
  } else {
    emptyCart.style.display = "none"
    checkoutButton.disabled = false

    // Calculate total
    let total = 0

    // Add items to cart
    cart.forEach((item) => {
      const itemTotal = item.price * item.quantity
      total += itemTotal

      const cartItem = document.createElement("div")
      cartItem.className = "selected-food"
      cartItem.innerHTML = `
        <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px;">
        <div class="food-details" style="flex: 1;">
          <h3>${item.name}</h3>
          <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
          <p style="color: var(--primary); font-weight: 500;">$${itemTotal.toFixed(2)}</p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <button class="icon-button" onclick="updateCartItem(${item.id}, ${item.quantity + 1})">
            <span class="material-icons-round">add</span>
          </button>
          <button class="icon-button" onclick="updateCartItem(${item.id}, ${item.quantity - 1})">
            <span class="material-icons-round">remove</span>
          </button>
        </div>
      `

      cartItemsContainer.appendChild(cartItem)
    })

    // Update total
    document.getElementById("cart-total").textContent = `$${total.toFixed(2)}`
  }

  // Show modal
  DOM.cartModal.classList.add("active")
}

// Update cart item
function updateCartItem(itemId, newQuantity) {
  const itemIndex = cart.findIndex((item) => item.id === itemId)

  if (itemIndex === -1) return

  if (newQuantity <= 0) {
    // Remove item
    cart.splice(itemIndex, 1)
    showToast("Item removed from cart")
  } else {
    // Update quantity
    cart[itemIndex].quantity = newQuantity
  }

  // Save to localStorage
  localStorage.setItem("cart", JSON.stringify(cart))

  // Update cart badge
  updateCartBadge()

  // Refresh cart modal
  showCartModal()
}

// Close cart modal
function closeCartModal() {
  DOM.cartModal.classList.remove("active")
}

// Checkout
function checkout() {
  if (cart.length === 0) {
    showToast("Your cart is empty")
    return
  }

  // Calculate total
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Check if user has enough credits
  if (userCredits < total) {
    showToast("Insufficient credits")
    return
  }

  // Deduct credits
  userCredits -= total
  localStorage.setItem(`credits_${currentUser.id}`, userCredits)
  updateCreditsDisplay()

  // Create orders for each cart item
  cart.forEach((item) => {
    const order = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      userId: currentUser ? currentUser.id : null,
      timestamp: new Date().toISOString(),
      foodId: item.id,
      foodName: item.name,
      foodImage: item.image,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
      status: "Pending",
      name: currentUser.name,
      phone: currentUser.phone,
      address: addresses.length > 0 ? addresses[0].address : "Default Address",
      notes: "",
      deliveryMethod: "Standard",
    }

    // Add to orders array
    orders.push(order)
  })

  // Save orders
  localStorage.setItem("orders", JSON.stringify(orders))

  // Clear cart
  cart = []
  localStorage.setItem("cart", JSON.stringify(cart))
  updateCartBadge()

  // Close cart modal
  closeCartModal()

  // Show success message
  showToast("Order placed successfully!")

  // Update orders display
  displayOrders()

  // Add notification
  addNotification("Order Placed", "Your cart items have been ordered successfully!")

  // Navigate to orders screen
  showScreen("orders")
}

// Add notification
function addNotification(title, message) {
  const notification = {
    id: Date.now(),
    title: title,
    message: message,
    time: new Date().toISOString(),
    read: false,
  }

  notifications.unshift(notification)
  localStorage.setItem("notifications", JSON.stringify(notifications))

  // Update notification badge
  updateNotificationBadge()
}

// Show notifications modal
function showNotificationsModal() {
  const notificationsList = document.getElementById("notifications-list")

  if (!notificationsList) return

  // Clear previous notifications
  notificationsList.innerHTML = ""

  if (notifications.length === 0) {
    notificationsList.innerHTML = `
      <div class="empty-state">
        <span class="material-icons-round">notifications_off</span>
        <h3>No Notifications</h3>
        <p>You don't have any notifications yet</p>
      </div>
    `
  } else {
    // Add notifications
    notifications.forEach((notification) => {
      const notificationItem = document.createElement("div")
      notificationItem.className = `menu-item ${notification.read ? "" : "unread"}`
      notificationItem.style.borderLeft = notification.read ? "none" : "3px solid var(--primary)"
      notificationItem.style.backgroundColor = notification.read ? "transparent" : "rgba(255, 87, 34, 0.05)"

      // Format time
      const notificationTime = new Date(notification.time)
      const formattedTime = notificationTime.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      notificationItem.innerHTML = `
        <div style="flex: 1;">
          <h4 style="font-size: 16px; margin-bottom: 4px;">${notification.title}</h4>
          <p style="color: var(--text-secondary); font-size: 14px;">${notification.message}</p>
          <p style="color: var(--text-secondary); font-size: 12px; margin-top: 4px;">${formattedTime}</p>
        </div>
        <button class="icon-button" onclick="markAsRead(${notification.id})">
          <span class="material-icons-round">${notification.read ? "visibility" : "visibility_off"}</span>
        </button>
      `

      notificationsList.appendChild(notificationItem)
    })
  }

  // Mark all as read
  notifications.forEach((notification) => {
    notification.read = true
  })
  localStorage.setItem("notifications", JSON.stringify(notifications))

  // Update notification badge
  updateNotificationBadge()

  // Show modal
  DOM.notificationsModal.classList.add("active")
}

// Mark notification as read
function markAsRead(notificationId) {
  const notification = notifications.find((n) => n.id === notificationId)

  if (notification) {
    notification.read = true
    localStorage.setItem("notifications", JSON.stringify(notifications))

    // Update notification badge
    updateNotificationBadge()

    // Refresh notifications modal
    showNotificationsModal()
  }
}

// Clear notifications
function clearNotifications() {
  notifications = []
  localStorage.setItem("notifications", JSON.stringify(notifications))

  // Update notification badge
  updateNotificationBadge()

  // Close modal
  closeNotificationsModal()

  showToast("All notifications cleared")
}

// Close notifications modal
function closeNotificationsModal() {
  DOM.notificationsModal.classList.remove("active")
}

// Show address modal
function showAddressModal() {
  const addressesList = document.getElementById("addresses-list")

  if (!addressesList) return

  // Clear previous addresses
  addressesList.innerHTML = ""

  if (addresses.length === 0) {
    addressesList.innerHTML = `
      <div class="empty-state">
        <span class="material-icons-round">location_off</span>
        <h3>No Addresses</h3>
        <p>You don't have any saved addresses yet</p>
      </div>
    `
  } else {
    // Add addresses
    addresses.forEach((address) => {
      const addressItem = document.createElement("div")
      addressItem.className = "menu-item"

      addressItem.innerHTML = `
        <span class="material-icons-round">location_on</span>
        <div style="flex: 1;">
          <p>${address.address}</p>
          ${address.default ? '<span style="color: var(--primary); font-size: 12px;">Default</span>' : ""}
        </div>
        <button class="icon-button" onclick="deleteAddress(${address.id})">
          <span class="material-icons-round">delete</span>
        </button>
      `

      addressesList.appendChild(addressItem)
    })
  }

  // Show modal
  DOM.addressModal.classList.add("active")
}

// Close address modal
function closeAddressModal() {
  DOM.addressModal.classList.remove("active")
}

// Show payment modal
function showPaymentModal() {
  const paymentMethodsList = document.getElementById("payment-methods-list")

  if (!paymentMethodsList) return

  // Clear previous payment methods
  paymentMethodsList.innerHTML = ""

  if (paymentMethods.length === 0) {
    paymentMethodsList.innerHTML = `
      <div class="empty-state">
        <span class="material-icons-round">credit_card_off</span>
        <h3>No Payment Methods</h3>
        <p>You don't have any saved payment methods yet</p>
      </div>
    `
  } else {
    // Add payment methods
    paymentMethods.forEach((method) => {
      const methodItem = document.createElement("div")
      methodItem.className = "menu-item"

      methodItem.innerHTML = `
        <span class="material-icons-round">credit_card</span>
        <div style="flex: 1;">
          <p>${method.cardNumber}</p>
          <span style="color: var(--text-secondary); font-size: 12px;">Expires: ${method.expiry}</span>
        </div>
        <button class="icon-button" onclick="deletePaymentMethod(${method.id})">
          <span class="material-icons-round">delete</span>
        </button>
      `

      paymentMethodsList.appendChild(methodItem)
    })
  }

  // Show modal
  DOM.paymentModal.classList.add("active")
}

// Close payment modal
function closePaymentModal() {
  DOM.paymentModal.classList.remove("active")
}

// Show favorites modal
function showFavoritesModal() {
  const favoritesList = document.getElementById("favorites-list")
  const emptyFavorites = document.getElementById("empty-favorites")

  if (!favoritesList || !emptyFavorites) return

  // Clear previous favorites
  favoritesList.innerHTML = ""

  if (favorites.length === 0) {
    emptyFavorites.style.display = "flex"
  } else {
    emptyFavorites.style.display = "none"

    // Create grid for favorites
    const grid = document.createElement("div")
    grid.className = "food-grid"

    // Add favorites
    favorites.forEach((food) => {
      grid.appendChild(createFoodCard(food))
    })

    favoritesList.appendChild(grid)
  }

  // Show modal
  DOM.favoritesModal.classList.add("active")
}

// Close favorites modal
function closeFavoritesModal() {
  DOM.favoritesModal.classList.remove("active")
}

// Show settings modal
function showSettingsModal() {
  // Update dark mode toggle
  document.getElementById("dark-mode-toggle").checked = currentTheme === "dark"

  // Show modal
  DOM.settingsModal.classList.add("active")
}

// Close settings modal
function closeSettingsModal() {
  DOM.settingsModal.classList.remove("active")
}

// Show help modal
function showHelpModal() {
  // Show modal
  DOM.helpModal.classList.add("active")
}

// Close help modal
function closeHelpModal() {
  DOM.helpModal.classList.remove("active")
}

// Show screen
function showScreen(screenId) {
  // Add transition effect
  document.querySelector(".content-container").style.opacity = "0.5"

  setTimeout(() => {
    // Hide all screens
    document.querySelectorAll(".screen-content").forEach((screen) => {
      screen.classList.remove("active")
    })

    // Show selected screen
    const screenToShow = document.getElementById(`${screenId}-screen`)
    if (screenToShow) {
      screenToShow.classList.add("active")

      // Refresh data based on screen
      if (screenId === "home") {
        displayFoodItems(currentFilter)
      } else if (screenId === "orders") {
        displayOrders()
      } else if (screenId === "profile") {
        updateProfileInfo()
      }
    }

    // Update active state in navigation
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("active")
    })
    const activeNavItem = document.querySelector(`.nav-item[onclick*="${screenId}"]`)
    if (activeNavItem) {
      activeNavItem.classList.add("active")
    }

    document.querySelector(".content-container").style.opacity = "1"
    console.log("Showing screen:", screenId)
  }, 300)
}

// Toggle theme
function toggleTheme() {
  const root = document.documentElement

  if (currentTheme === "light") {
    // Switch to dark theme
    root.style.setProperty("--background", "#121212")
    root.style.setProperty("--surface", "#1e1e1e")
    root.style.setProperty("--text-primary", "#ffffff")
    root.style.setProperty("--text-secondary", "#b0b0b0")
    root.style.setProperty("--border", "#333333")
    currentTheme = "dark"

    // Update dark mode toggle in settings
    const darkModeToggle = document.getElementById("dark-mode-toggle")
    if (darkModeToggle) darkModeToggle.checked = true
  } else {
    // Switch back to light theme
    root.style.setProperty("--background", "#f5f5f5")
    root.style.setProperty("--surface", "#ffffff")
    root.style.setProperty("--text-primary", "#212121")
    root.style.setProperty("--text-secondary", "#757575")
    root.style.setProperty("--border", "#e0e0e0")
    currentTheme = "light"

    // Update dark mode toggle in settings
    const darkModeToggle = document.getElementById("dark-mode-toggle")
    if (darkModeToggle) darkModeToggle.checked = false
  }

  showToast(`Switched to ${currentTheme} mode`)
}

// Utility: Show toast message
function showToast(message, duration = 3000) {
  // Check if toast container exists, create if not
  let toastContainer = document.querySelector(".toast-container")
  if (!toastContainer) {
    toastContainer = document.createElement("div")
    toastContainer.className = "toast-container"
    document.body.appendChild(toastContainer)
  }

  // Create toast element
  const toast = document.createElement("div")
  toast.className = "toast"
  toast.textContent = message

  // Add to container
  toastContainer.appendChild(toast)

  // Show toast
  setTimeout(() => {
    toast.classList.add("show")
  }, 10)

  // Remove after duration
  setTimeout(() => {
    toast.classList.remove("show")
    setTimeout(() => {
      toast.remove()
    }, 300)
  }, duration)
}

// Utility: Validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Utility: Validate phone number
function isValidPhone(phone) {
  // Basic validation - at least 10 digits
  const phoneRegex = /^\+?[0-9]{10,15}$/
  return phoneRegex.test(phone.replace(/[\s-]/g, ""))
}

// Food items data
const foodItems = [
  {
    id: 1,
    name: "Margherita Pizza",
    price: 12.99,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500",
  },
  {
    id: 2,
    name: "Classic Burger",
    price: 9.99,
    category: "Burger",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
  },
  {
    id: 3,
    name: "California Roll",
    price: 14.99,
    category: "Sushi",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500",
  },
  {
    id: 4,
    name: "Chocolate Cake",
    price: 6.99,
    category: "Dessert",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500",
  },
  {
    id: 5,
    name: "Pepperoni Pizza",
    price: 13.99,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500",
  },
  {
    id: 6,
    name: "Cheese Burger",
    price: 10.99,
    category: "Burger",
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500",
  },
  {
    id: 7,
    name: "Dragon Roll",
    price: 16.99,
    category: "Sushi",
    image: "https://images.unsplash.com/photo-1617196035154-1e7e6e28b0db?w=500",
  },
  {
    id: 8,
    name: "Tiramisu",
    price: 7.99,
    category: "Dessert",
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500",
  },
  {
    id: 9,
    name: "BBQ Chicken Pizza",
    price: 14.99,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500",
  },
  {
    id: 10,
    name: "Bacon Burger",
    price: 11.99,
    category: "Burger",
    image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500",
  },
  {
    id: 11,
    name: "Veggie Bowl",
    price: 12.99,
    category: "Popular",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
  },
  {
    id: 12,
    name: "Fruit Salad",
    price: 8.99,
    category: "Popular",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500",
  },
  {
    id: 13,
    name: "Ramen Noodles",
    price: 13.99,
    category: "Popular",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500",
  },
  {
    id: 14,
    name: "Mochi Ice Cream",
    price: 9.99,
    category: "Dessert",
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500",
  },
]

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeApp)

