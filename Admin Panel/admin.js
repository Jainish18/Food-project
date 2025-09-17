// DOM Elements
const authScreen = document.getElementById("auth-screen")
const mainApp = document.getElementById("main-app")
const authForm = document.getElementById("auth-form")

// Admin credentials (in real app, this would be handled server-side)
const ADMIN_EMAIL = "admin@example.com"
const ADMIN_PASSWORD = "admin123"

// Screen Management
function showScreen(screenId) {
  console.log("Showing screen:", screenId)
  // Hide all screens first
  document.querySelectorAll(".screen-content").forEach((screen) => {
    screen.classList.remove("active")
  })

  // Show the selected screen
  const screenToShow = document.getElementById(screenId + "-screen")
  if (screenToShow) {
    screenToShow.classList.add("active")
    console.log("Screen activated:", screenId)

    // Load screen specific data
    switch (screenId) {
      case "dashboard":
        loadDashboardStats()
        break
      case "orders":
        loadOrders()
        break
      case "menu":
        loadMenuItems()
        break
      case "users":
        // loadUsers()
        break
    }
  }

  // Update active state in bottom navigation
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active")
  })
  const activeNavItem = document.querySelector(`.nav-item[onclick*="${screenId}"]`)
  if (activeNavItem) {
    activeNavItem.classList.add("active")
  }
}

// Authentication
function handleAuth(event) {
  event.preventDefault()
  console.log("Handling authentication...")

  const email = document.getElementById("email").value
  const password = document.getElementById("password").value

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    // Store admin session
    localStorage.setItem("adminSession", "true")

    // Show main app
    authScreen.classList.remove("active")
    mainApp.classList.add("active")

    // Initialize dashboard
    showScreen("dashboard")
    console.log("Admin authenticated")
  } else {
    alert("Invalid credentials")
  }
}

// Check if admin is already authenticated
function checkAuth() {
  console.log("Checking admin authentication...")
  const adminSession = localStorage.getItem("adminSession")

  if (adminSession === "true") {
    authScreen.classList.remove("active")
    mainApp.classList.add("active")
    showScreen("dashboard")
    console.log("Admin session found")
  } else {
    authScreen.classList.add("active")
    mainApp.classList.remove("active")
    console.log("No admin session found")
  }
}

// Logout Handler
function handleLogout() {
  console.log("Logging out admin...")
  localStorage.removeItem("adminSession")
  authScreen.classList.add("active")
  mainApp.classList.remove("active")
  if (authForm) {
    authForm.reset()
  }
  console.log("Admin logged out")
}

// Dashboard Stats
function loadDashboardStats() {
  console.log("Loading dashboard stats...")
  const orders = JSON.parse(localStorage.getItem("orders") || "[]")
  const foods = JSON.parse(localStorage.getItem("foods") || "[]")
  const users = JSON.parse(localStorage.getItem("users") || "[]")

  document.getElementById("total-orders").textContent = orders.length
  document.getElementById("pending-orders").textContent = orders.filter((order) => order.status === "Pending").length
  document.getElementById("total-items").textContent = foods.length
  document.getElementById("total-users").textContent = users.length
}

// Orders Management
function loadOrders() {
  console.log("Loading orders...")
  const orders = JSON.parse(localStorage.getItem("orders") || "[]")
  const container = document.getElementById("orders-container")

  if (container) {
    container.innerHTML = ""
    orders.forEach((order) => {
      const orderElement = createOrderElement(order)
      container.appendChild(orderElement)
    })
  }
}

function createOrderElement(order) {
  const div = document.createElement("div")
  div.className = "order-item"
  div.innerHTML = `
        <div class="order-header">
            <div class="order-title">
                <span class="order-id">Order #${order.id}</span>
                <span class="order-status ${order.status.toLowerCase()}">
                    <span class="status-dot"></span>
                    ${order.status}
                </span>
            </div>
            <div class="timestamp">${new Date(order.timestamp).toLocaleString()}</div>
        </div>
        <div class="order-content">
            <div class="order-food-details">
                <img src="${order.foodImage}" alt="${order.foodName}">
                <div class="food-info">
                    <h4>${order.foodName}</h4>
                    <p>Quantity: ${order.quantity}</p>
                    <p class="price">Total: $${order.total.toFixed(2)}</p>
                </div>
            </div>
            <div class="customer-details">
                <div class="detail-item">
                    <span class="material-icons-round">person</span>
                    <div>
                        <label>Customer Name</label>
                        <p>${order.name}</p>
                    </div>
                </div>
                <div class="detail-item">
                    <span class="material-icons-round">phone</span>
                    <div>
                        <label>Mobile Number</label>
                        <p>${order.phone}</p>
                    </div>
                </div>
                <div class="detail-item">
                    <span class="material-icons-round">location_on</span>
                    <div>
                        <label>Delivery Address</label>
                        <p>${order.address}</p>
                    </div>
                </div>
                ${
                  order.notes
                    ? `
                <div class="detail-item">
                    <span class="material-icons-round">note</span>
                    <div>
                        <label>Special Instructions</label>
                        <p>${order.notes}</p>
                    </div>
                </div>
                `
                    : ""
                }
            </div>
        </div>
        <div class="order-actions">
            ${
              order.status === "Pending"
                ? `
                <button class="button button-primary" onclick="updateOrderStatus(${order.id}, 'Completed')">
                    <span class="material-icons-round">check_circle</span>
                    Mark as Completed
                </button>
            `
                : ""
            }
            <button class="button button-secondary" onclick="deleteOrder(${order.id})">
                <span class="material-icons-round">delete</span>
                Delete Order
            </button>
        </div>
    `
  return div
}

function updateOrderStatus(orderId, newStatus) {
  console.log("Updating order status:", orderId, newStatus)
  const orders = JSON.parse(localStorage.getItem("orders") || "[]")
  const updatedOrders = orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
  localStorage.setItem("orders", JSON.stringify(updatedOrders))
  loadOrders()
  loadDashboardStats()
}

function deleteOrder(orderId) {
  console.log("Deleting order:", orderId)
  if (confirm("Are you sure you want to delete this order?")) {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]")
    const filteredOrders = orders.filter((order) => order.id !== orderId)
    localStorage.setItem("orders", JSON.stringify(filteredOrders))
    loadOrders()
    loadDashboardStats()
  }
}

function filterOrders(filter) {
  console.log("Filtering orders:", filter)
  const orders = JSON.parse(localStorage.getItem("orders") || "[]")
  const container = document.getElementById("orders-container")

  if (container) {
    container.innerHTML = ""
    let filteredOrders = orders

    if (filter !== "all") {
      filteredOrders = orders.filter((order) => order.status.toLowerCase() === filter)
    }

    filteredOrders.forEach((order) => {
      const orderElement = createOrderElement(order)
      container.appendChild(orderElement)
    })

    // Update active filter
    document.querySelectorAll(".chip").forEach((chip) => {
      chip.classList.remove("active")
    })
    document.querySelector(`.chip[onclick*="${filter}"]`).classList.add("active")
  }
}

// Menu Management
function loadMenuItems() {
  console.log("Loading menu items...")
  const foods = JSON.parse(localStorage.getItem("foods") || "[]")
  const container = document.getElementById("menu-container")

  if (container) {
    container.innerHTML = ""
    foods.forEach((food) => {
      const foodElement = createFoodElement(food)
      container.appendChild(foodElement)
    })
  }
}

function createFoodElement(food) {
  const div = document.createElement("div")
  div.className = "food-card"
  div.innerHTML = `
        <img src="${food.image}" alt="${food.name}">
        <div class="food-card-content">
            <h3>${food.name}</h3>
            <p>${food.category}</p>
            <div class="price">$${food.price}</div>
        </div>
        <div class="food-card-actions">
            <button class="button button-secondary" onclick="deleteMenuItem(${food.id})">
                <span class="material-icons-round">delete</span>
            </button>
        </div>
    `
  return div
}

function showAddItemModal() {
  document.getElementById("add-item-modal").classList.add("active")
}

function closeAddItemModal() {
  document.getElementById("add-item-modal").classList.remove("active")
  document.getElementById("add-item-form").reset()
}

function addMenuItem() {
  const name = document.getElementById("item-name").value
  const category = document.getElementById("item-category").value
  const price = document.getElementById("item-price").value
  const image = document.getElementById("item-image").value

  if (name && category && price && image) {
    const foods = JSON.parse(localStorage.getItem("foods") || "[]")
    const newFood = {
      id: Date.now(),
      name,
      category,
      price: Number.parseFloat(price),
      image,
    }

    foods.push(newFood)
    localStorage.setItem("foods", JSON.stringify(foods))

    closeAddItemModal()
    loadMenuItems()
    loadDashboardStats()
  }
}

function deleteMenuItem(foodId) {
  console.log("Deleting menu item:", foodId)
  if (confirm("Are you sure you want to delete this menu item?")) {
    const foods = JSON.parse(localStorage.getItem("foods") || "[]")
    const filteredFoods = foods.filter((food) => food.id !== foodId)
    localStorage.setItem("foods", JSON.stringify(filteredFoods))
    loadMenuItems()
    loadDashboardStats()
  }
}

// User Management
let users = []

// Fetch users from localStorage and set up real-time updates
function initializeUserManagement() {
  // Initial load of users
  fetchUsers()

  // Set up storage event listener for real-time updates
  window.addEventListener("storage", (e) => {
    if (e.key === "users") {
      fetchUsers()
    }
  })

  // Periodic refresh every 5 seconds as backup
  setInterval(fetchUsers, 5000)
}

// Fetch users from localStorage
function fetchUsers() {
  try {
    const storedUsers = JSON.parse(localStorage.getItem("users")) || []
    users = storedUsers
    displayUsers()
    updateUserCount()
  } catch (error) {
    console.error("Error fetching users:", error)
  }
}

// Display users in cards
function displayUsers() {
  const usersContainer = document.getElementById("users-container")
  if (!usersContainer) return

  usersContainer.innerHTML = ""

  if (users.length === 0) {
    usersContainer.innerHTML = '<p class="no-results">No users registered yet</p>'
    return
  }

  users.forEach((user) => {
    const userCard = document.createElement("div")
    userCard.className = "user-card"
    userCard.innerHTML = `
            <div class="user-avatar">
                <span class="material-icons-round">account_circle</span>
            </div>
            <div class="user-details">
                <h4>${user.name || "N/A"}</h4>
                <p><span class="material-icons-round">email</span> ${user.email || "N/A"}</p>
                <p><span class="material-icons-round">phone</span> ${user.phone || "N/A"}</p>
                <p class="user-date"><span class="material-icons-round">calendar_today</span> ${new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
        `
    usersContainer.appendChild(userCard)
  })
}

// Update total users count in dashboard
function updateUserCount() {
  const totalUsersElement = document.getElementById("total-users")
  if (totalUsersElement) {
    totalUsersElement.textContent = users.length
  }
}

// Search users
const userSearchInput = document.getElementById("user-search")
if (userSearchInput) {
  userSearchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase()
    const filteredUsers = users.filter(
      (user) =>
        (user.name && user.name.toLowerCase().includes(searchTerm)) ||
        (user.email && user.email.toLowerCase().includes(searchTerm)) ||
        (user.phone && user.phone.toLowerCase().includes(searchTerm)),
    )
    displayFilteredUsers(filteredUsers)
  })
}

function displayFilteredUsers(filteredUsers) {
  const usersContainer = document.getElementById("users-container")
  if (!usersContainer) return

  usersContainer.innerHTML = ""

  if (filteredUsers.length === 0) {
    usersContainer.innerHTML = '<p class="no-results">No users found</p>'
    return
  }

  filteredUsers.forEach((user) => {
    const userCard = document.createElement("div")
    userCard.className = "user-card"
    userCard.innerHTML = `
            <div class="user-avatar">
                <span class="material-icons-round">account_circle</span>
            </div>
            <div class="user-details">
                <h4>${user.name || "N/A"}</h4>
                <p><span class="material-icons-round">email</span> ${user.email || "N/A"}</p>
                <p><span class="material-icons-round">phone</span> ${user.phone || "N/A"}</p>
                <p class="user-date"><span class="material-icons-round">calendar_today</span> ${new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
        `
    usersContainer.appendChild(userCard)
  })
}

// Initialize user management when the page loads
document.addEventListener("DOMContentLoaded", () => {
  initializeUserManagement()
})

// Function to clear all admin data
function clearAdminData() {
  if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
    // Clear all localStorage data
    localStorage.removeItem("adminData")
    localStorage.removeItem("menuItems")
    localStorage.removeItem("orders")
    localStorage.removeItem("users")

    // Reset UI elements
    document.getElementById("total-orders").textContent = "0"
    document.getElementById("pending-orders").textContent = "0"
    document.getElementById("total-items").textContent = "0"
    document.getElementById("total-users").textContent = "0"

    document.getElementById("orders-container").innerHTML = ""
    document.getElementById("menu-container").innerHTML = ""
    document.getElementById("users-container").innerHTML = ""

    // Reset search input
    document.getElementById("menu-search-input").value = ""

    // Show auth screen and hide main app
    document.getElementById("auth-screen").classList.add("active")
    document.getElementById("main-app").classList.remove("active")

    // Reset auth form
    document.getElementById("auth-form").reset()

    // Show confirmation message
    alert("All admin data has been cleared successfully!")
  }
}

// Add clear data button to top app bar
document.querySelector(".top-app-bar").innerHTML += `
    <button class="button button-secondary" onclick="clearAdminData()">
        <span class="material-icons-round">delete_forever</span>
        Clear All Data
    </button>
`

// Event Listeners
if (authForm) {
  authForm.addEventListener("submit", handleAuth)
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  console.log("Admin dashboard initializing...")
  checkAuth()
})

