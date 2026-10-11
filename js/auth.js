/**
 * BerryPulse Wellness Tracker - Authentication & Access Controls
 * Multi-account management (up to 10 accounts) with Role-Based Access Control (RBAC),
 * credential authentication (PIN / password), session persistence, and isolated data partitions.
 */

const BerryPulseAuth = {
  MAX_ACCOUNTS: 10,
  STORAGE_KEY_ACCOUNTS: 'berrypulse_accounts_v3',
  STORAGE_KEY_SESSION: 'berrypulse_active_session_v5',

  // Pre-seeded starter accounts (Password for all users: test)
  defaultAccounts: [
    {
      id: 'usr_courtney',
      username: 'courtney',
      displayName: 'Courtney',
      pin: 'test',
      role: 'admin', // 'admin' | 'member'
      avatar: '👑',
      createdAt: '2026-10-01',
      lastActive: new Date().toISOString().split('T')[0],
      bio: 'Lead Wellness Administrator'
    },
    {
      id: 'usr_alex',
      username: 'alex',
      displayName: 'Alex',
      pin: 'test',
      role: 'member',
      avatar: '🏃',
      createdAt: '2026-10-05',
      lastActive: new Date().toISOString().split('T')[0],
      bio: 'Endurance Runner & Macro Tracker'
    },
    {
      id: 'usr_jordan',
      username: 'jordan',
      displayName: 'Jordan',
      pin: 'test',
      role: 'member',
      avatar: '🧘',
      createdAt: '2026-10-08',
      lastActive: new Date().toISOString().split('T')[0],
      bio: 'Mindfulness & Holistic Nutrition'
    }
  ],

  // In-memory active session
  currentSession: null,

  init: function () {
    this.ensureAccountsStorage();
    this.restoreSession();

    if (this.isLoggedIn()) {
      this.unlockApp();
    } else {
      this.lockApp();
    }
  },

  // Ensure accounts array exists & all users have username and password 'test'
  ensureAccountsStorage: function () {
    try {
      // Clear legacy storage session keys so users MUST log in before seeing anything
      ['berrypulse_active_session', 'berrypulse_active_session_v1', 'berrypulse_active_session_v2', 'berrypulse_active_session_v3', 'berrypulse_active_session_v4'].forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
        try { sessionStorage.removeItem(k); } catch (e) {}
      });

      const stored = localStorage.getItem(this.STORAGE_KEY_ACCOUNTS);
      if (!stored) {
        // Also check if v2 accounts exist to preserve any user-created accounts
        const prevStored = localStorage.getItem('berrypulse_accounts_v2');
        let accounts = [...this.defaultAccounts];
        if (prevStored) {
          try {
            const parsed = JSON.parse(prevStored);
            if (Array.isArray(parsed) && parsed.length > 0) accounts = parsed;
          } catch (e) {}
        }
        // Guarantee password is 'test' and username is set for all accounts
        accounts.forEach(acc => {
          acc.pin = 'test';
          if (!acc.username) acc.username = (acc.displayName || acc.id).toLowerCase().replace(/[^a-z0-9]/g, '');
        });
        localStorage.setItem(this.STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
      } else {
        const accounts = JSON.parse(stored);
        if (Array.isArray(accounts)) {
          let updated = false;
          accounts.forEach(acc => {
            if (acc.pin !== 'test') {
              acc.pin = 'test';
              updated = true;
            }
            if (!acc.username) {
              acc.username = (acc.displayName || acc.id).toLowerCase().replace(/[^a-z0-9]/g, '');
              updated = true;
            }
          });
          if (updated) {
            localStorage.setItem(this.STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
          }
        }
      }
    } catch (e) {
      console.warn('BerryPulseAuth: error initializing accounts storage', e);
    }
  },

  getAccounts: function () {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_ACCOUNTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('BerryPulseAuth: failed to get accounts', e);
    }
    return [...this.defaultAccounts];
  },

  saveAccounts: function (accounts) {
    try {
      localStorage.setItem(this.STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.error('BerryPulseAuth: failed to save accounts', e);
    }
  },

  getAccountById: function (id) {
    const accounts = this.getAccounts();
    return accounts.find(a => a.id === id) || null;
  },

  getAccountByUsername: function (username) {
    if (!username) return null;
    const clean = username.trim().toLowerCase();
    const accounts = this.getAccounts();
    return accounts.find(a => a.username.toLowerCase() === clean) || null;
  },

  // Session handling (strictly gated: user MUST log in before seeing anything)
  restoreSession: function () {
    try {
      // Only restore from current tab's active sessionStorage if user already logged in during this active browsing tab
      const saved = sessionStorage.getItem(this.STORAGE_KEY_SESSION);
      if (saved) {
        const session = JSON.parse(saved);
        const account = this.getAccountById(session.userId);
        if (account) {
          this.currentSession = {
            userId: account.id,
            loginTime: session.loginTime || Date.now(),
            rememberMe: !!session.rememberMe
          };
          this.touchUserActive(account.id);
          return;
        }
      }
    } catch (e) {
      console.warn('BerryPulseAuth: error restoring session', e);
    }

    // Default to locked landing screen: user must log in before seeing anything
    this.currentSession = null;
  },

  saveSession: function () {
    try {
      if (this.currentSession) {
        sessionStorage.setItem(this.STORAGE_KEY_SESSION, JSON.stringify(this.currentSession));
        if (this.currentSession.rememberMe) {
          localStorage.setItem(this.STORAGE_KEY_SESSION, JSON.stringify(this.currentSession));
        } else {
          localStorage.removeItem(this.STORAGE_KEY_SESSION);
        }
      } else {
        localStorage.removeItem(this.STORAGE_KEY_SESSION);
        sessionStorage.removeItem(this.STORAGE_KEY_SESSION);
      }
    } catch (e) { }
  },

  lockApp: function () {
    const landing = document.getElementById('auth-landing-page');
    const shell = document.getElementById('app-shell');
    if (shell) {
      shell.classList.add('hidden');
      shell.style.display = 'none';
    }
    if (landing) {
      landing.classList.remove('hidden');
      landing.style.display = 'flex';
    }
    this.renderLandingCapacityBadge();
  },

  unlockApp: function () {
    const landing = document.getElementById('auth-landing-page');
    const shell = document.getElementById('app-shell');
    if (landing) {
      landing.classList.add('hidden');
      landing.style.display = 'none';
    }
    if (shell) {
      shell.classList.remove('hidden');
      shell.style.display = 'block';
    }
    this.renderHeaderUserChip();
    if (window.BerryPulseApp && typeof BerryPulseApp.updateHeaderDateDisplay === 'function') {
      BerryPulseApp.updateHeaderDateDisplay();
    }
  },

  touchUserActive: function (userId) {
    try {
      const accounts = this.getAccounts();
      const acc = accounts.find(a => a.id === userId);
      if (acc) {
        acc.lastActive = new Date().toISOString().split('T')[0];
        this.saveAccounts(accounts);
      }
    } catch (e) { }
  },

  getCurrentUser: function () {
    if (!this.currentSession || !this.currentSession.userId) {
      return null;
    }
    return this.getAccountById(this.currentSession.userId);
  },

  getCurrentUserId: function () {
    return this.currentSession ? this.currentSession.userId : 'usr_courtney';
  },

  isLoggedIn: function () {
    return !!(this.currentSession && this.getCurrentUser());
  },

  isAdmin: function () {
    const user = this.getCurrentUser();
    return !!(user && user.role === 'admin');
  },

  // Access control checker
  hasPermission: function (action, targetUserId) {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Admins have universal authority
    if (user.role === 'admin') return true;

    // Members have self-service authority on own account
    switch (action) {
      case 'edit_profile':
      case 'view_data':
      case 'change_pin':
        return targetUserId ? targetUserId === user.id : true;
      case 'manage_accounts':
      case 'create_account':
      case 'delete_account':
      case 'change_user_role':
        return false; // Denied to standard members
      default:
        return false;
    }
  },

  // Login handler
  login: function (username, pin, rememberMe = true) {
    if (!username) {
      throw new Error('Please enter your username (e.g. courtney, alex, jordan).');
    }
    const account = this.getAccountByUsername(username);
    if (!account) {
      throw new Error(`Account "@${username}" was not found. Please choose an active username or Sign Up.`);
    }

    const entered = (pin || '').trim();
    // For all users, password is 'test' for right now
    if (entered !== 'test' && entered !== account.pin) {
      throw new Error('Incorrect password. Please try again.');
    }

    this.currentSession = {
      userId: account.id,
      loginTime: Date.now(),
      rememberMe: !!rememberMe
    };
    this.saveSession();
    this.touchUserActive(account.id);

    // Switch data partition in Storage
    if (window.BerryPulseStorage && BerryPulseStorage.switchUser) {
      BerryPulseStorage.switchUser(account.id);
    }

    this.unlockApp();
    this.renderHeaderUserChip();
    this.hideAuthGateModal();

    if (window.BerryPulseApp && BerryPulseApp.showToast) {
      BerryPulseApp.showToast(`👋 Welcome back, ${account.displayName}! Signed in as ${account.role === 'admin' ? 'Admin 👑' : 'Member 👤'}`);
    }

    return account;
  },

  // Helper to populate login form fields
  fillLoginForm: function (username) {
    const userInp = document.getElementById('auth-login-user');
    const pinInp = document.getElementById('auth-login-pin');
    const errEl = document.getElementById('auth-login-error');
    if (userInp) userInp.value = username;
    if (pinInp) pinInp.value = 'test';
    if (errEl) errEl.classList.add('hidden');
    if (userInp) userInp.focus();
  },

  // Direct switch to an account (prompts PIN if required)
  switchAccount: function (targetUserId, bypassPin = false) {
    const target = this.getAccountById(targetUserId);
    if (!target) return;

    if (bypassPin || !target.pin) {
      this.currentSession = {
        userId: target.id,
        loginTime: Date.now(),
        rememberMe: true
      };
      this.saveSession();
      this.touchUserActive(target.id);

      if (window.BerryPulseStorage && BerryPulseStorage.switchUser) {
        BerryPulseStorage.switchUser(target.id);
      }

      this.unlockApp();
      this.renderHeaderUserChip();
      this.closeAccountDropdown();
      this.hideAuthGateModal();

      if (window.BerryPulseApp && BerryPulseApp.showToast) {
        BerryPulseApp.showToast(`Switched account to ${target.displayName} (${target.role}) ✨`);
      }
    } else {
      // Open PIN verification modal
      this.openPinPromptModal(target);
    }
  },

  logout: function () {
    this.currentSession = null;
    this.saveSession();
    this.renderHeaderUserChip();
    this.closeAccountDropdown();
    this.hideAuthGateModal();
    this.lockApp();

    if (window.BerryPulseApp && BerryPulseApp.showToast) {
      BerryPulseApp.showToast('🔒 Signed out. Welcome back anytime!');
    }
  },

  // Full-Page Landing View Handlers (when user gets to URL)
  handleLandingLogin: function () {
    const userInp = document.getElementById('auth-login-user');
    const pinInp = document.getElementById('auth-login-pin');
    const rememberInp = document.getElementById('auth-login-remember');
    const errEl = document.getElementById('auth-login-error');
    if (!userInp) return;

    try {
      const u = userInp.value.trim();
      const p = (pinInp && pinInp.value.trim()) ? pinInp.value.trim() : 'test';
      const rem = rememberInp ? rememberInp.checked : true;
      if (!u) throw new Error('Please enter your username (e.g. courtney, alex, jordan).');
      this.login(u, p, rem);
      if (errEl) errEl.classList.add('hidden');
    } catch (err) {
      if (errEl) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
      }
    }
  },

  handleLandingSignup: function () {
    const nameInp = document.getElementById('auth-signup-name');
    const userInp = document.getElementById('auth-signup-user');
    const pinInp = document.getElementById('auth-signup-pin');
    const roleInp = document.getElementById('auth-signup-role');
    const avatarInp = document.querySelector('input[name="auth-landing-avatar"]:checked');
    const calInp = document.getElementById('auth-signup-calories');
    const protInp = document.getElementById('auth-signup-protein');
    const errEl = document.getElementById('auth-signup-error');

    try {
      const name = nameInp ? nameInp.value.trim() : '';
      const username = userInp ? userInp.value.trim() : '';
      const pin = (pinInp && pinInp.value.trim()) ? pinInp.value.trim() : 'test';
      const role = roleInp ? roleInp.value : 'member';
      const avatar = avatarInp ? avatarInp.value : '🫐';
      const cal = calInp ? parseInt(calInp.value, 10) : 2100;
      const p = protInp ? parseInt(protInp.value, 10) : 135;

      if (!name) throw new Error('Please provide your name.');
      if (!username) throw new Error('Please choose a username.');

      const newAccount = this.createAccount({
        displayName: name,
        username: username,
        pin: pin,
        role: role,
        avatar: avatar,
        startingGoalCalories: cal,
        startingProteinGrams: p
      });

      if (errEl) errEl.classList.add('hidden');
      this.unlockApp();
    } catch (err) {
      if (errEl) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
      }
    }
  },

  switchLandingTab: function (tabName) {
    const tabs = ['login', 'signup'];
    tabs.forEach(t => {
      const btn = document.getElementById(`auth-landing-tab-${t}`);
      const pane = document.getElementById(`auth-landing-pane-${t}`);
      if (btn) {
        if (t === tabName) {
          btn.className = 'flex-1 py-3 rounded-2xl text-xs font-bold bg-pink-600 text-white shadow-lg shadow-pink-600/30 transition';
        } else {
          btn.className = 'flex-1 py-3 rounded-2xl text-xs font-semibold bg-berry-900/60 text-berry-300 hover:text-white transition';
        }
      }
      if (pane) {
        if (t === tabName) {
          pane.classList.remove('hidden');
          pane.style.display = 'block';
        } else {
          pane.classList.add('hidden');
          pane.style.display = 'none';
        }
      }
    });

    this.renderLandingCapacityBadge();
  },

  renderLandingProfilesGrid: function () {
    const container = document.getElementById('auth-landing-profiles-grid');
    if (!container) return;

    const accounts = this.getAccounts();
    container.innerHTML = accounts.map(acc => {
      const isAdmin = acc.role === 'admin';
      return `
        <div onclick="BerryPulseAuth.switchAccount('${acc.id}')" class="p-3.5 rounded-2xl bg-berry-900/60 hover:bg-berry-800 border border-berry-700/50 hover:border-pink-500/50 cursor-pointer transition flex items-center justify-between group shadow-sm">
          <div class="flex items-center gap-3">
            <span class="text-3xl">${acc.avatar || '👤'}</span>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-bold text-white group-hover:text-pink-300 transition">${acc.displayName}</span>
                ${isAdmin ? '<span class="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">ADMIN</span>' : '<span class="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">MEMBER</span>'}
              </div>
              <p class="text-xs text-berry-300/80 mt-0.5">@${acc.username} • Password: <code class="text-pink-300 font-bold">test</code></p>
            </div>
          </div>
          <button type="button" class="px-3 py-1.5 rounded-xl bg-pink-600/30 group-hover:bg-pink-600 text-pink-300 group-hover:text-white text-xs font-bold transition">
            Log In →
          </button>
        </div>
      `;
    }).join('');
  },

  renderLandingCapacityBadge: function () {
    const accounts = this.getAccounts();
    const remaining = this.MAX_ACCOUNTS - accounts.length;
    const badge = document.getElementById('auth-landing-capacity-badge');
    if (badge) {
      badge.textContent = `${accounts.length} / ${this.MAX_ACCOUNTS} Accounts Active (${remaining} Slots Available)`;
    }
    const gateBadge = document.getElementById('auth-accounts-count-badge');
    if (gateBadge) {
      gateBadge.textContent = `${accounts.length} / ${this.MAX_ACCOUNTS} Accounts Active`;
    }
  },

  // Create a new account (max 10 accounts limit enforcement)
  createAccount: function (userData) {
    const accounts = this.getAccounts();

    // Access control: enforce 10 accounts maximum limit
    if (accounts.length >= this.MAX_ACCOUNTS) {
      throw new Error(`Account capacity reached (${this.MAX_ACCOUNTS} accounts max). Please delete an existing account to add another.`);
    }

    const username = (userData.username || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!username || username.length < 2) {
      throw new Error('Username must be at least 2 alphanumeric characters.');
    }

    if (this.getAccountByUsername(username)) {
      throw new Error(`Username "${username}" is already taken.`);
    }

    const pin = (userData.pin || 'test').trim() || 'test';
    if (pin.length < 4) {
      throw new Error('PIN / Password must be at least 4 digits/characters.');
    }

    // Role check: Only existing admins can assign admin role; default to member
    let role = userData.role === 'admin' ? 'admin' : 'member';
    if (role === 'admin' && !this.isAdmin() && accounts.length > 0) {
      role = 'member'; // Fallback to member if not admin
    }

    const newAccount = {
      id: `usr_${username}_${Date.now().toString(36)}`,
      username: username,
      displayName: (userData.displayName || username).trim(),
      pin: pin,
      role: role,
      avatar: userData.avatar || '🫐',
      createdAt: new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString().split('T')[0],
      bio: userData.bio || 'BerryPulse Member'
    };

    accounts.push(newAccount);
    this.saveAccounts(accounts);

    // Seed tailored initial data for new user partition
    if (window.BerryPulseStorage && BerryPulseStorage.seedUserPartition) {
      BerryPulseStorage.seedUserPartition(newAccount.id, {
        displayName: newAccount.displayName,
        startingGoalCalories: userData.startingGoalCalories || 2000,
        startingProteinGrams: userData.startingProteinGrams || 130
      });
    }

    // Automatically switch to the newly created account
    this.switchAccount(newAccount.id, true);

    if (window.BerryPulseApp && BerryPulseApp.showToast) {
      BerryPulseApp.showToast(`🎉 Account "${newAccount.displayName}" created! (${accounts.length}/${this.MAX_ACCOUNTS} accounts used)`);
    }

    return newAccount;
  },

  // Delete an account (Admin only)
  deleteAccount: function (userId) {
    if (!this.isAdmin()) {
      throw new Error('Access Denied: Only administrators can delete accounts.');
    }

    const accounts = this.getAccounts();
    const target = accounts.find(a => a.id === userId);
    if (!target) {
      throw new Error('Account not found.');
    }

    // Protection: Prevent deleting the only remaining admin
    const admins = accounts.filter(a => a.role === 'admin');
    if (target.role === 'admin' && admins.length <= 1) {
      throw new Error('Cannot delete the only remaining Administrator account.');
    }

    // Remove account from list
    const updated = accounts.filter(a => a.id !== userId);
    this.saveAccounts(updated);

    // Clean up isolated data partition
    try {
      localStorage.removeItem(`berrypulse_user_data_v1_${userId}`);
      localStorage.removeItem(`berrypulse_user_profile_v1_${userId}`);
    } catch (e) { }

    // If deleting current active account, switch to first remaining admin
    if (this.currentSession && this.currentSession.userId === userId) {
      const fallback = updated.find(a => a.role === 'admin') || updated[0];
      if (fallback) {
        this.switchAccount(fallback.id, true);
      }
    } else {
      this.renderHeaderUserChip();
      this.renderAccountManagerList();
    }

    if (window.BerryPulseApp && BerryPulseApp.showToast) {
      BerryPulseApp.showToast(`Deleted account "${target.displayName}". Slot is now available (${updated.length}/${this.MAX_ACCOUNTS}).`);
    }
  },

  // Update account role or info (Admin or self)
  updateAccount: function (userId, updates) {
    const accounts = this.getAccounts();
    const account = accounts.find(a => a.id === userId);
    if (!account) throw new Error('Account not found.');

    const isSelf = this.currentSession && this.currentSession.userId === userId;

    if (updates.displayName) account.displayName = updates.displayName.trim();
    if (updates.avatar) account.avatar = updates.avatar;
    if (updates.bio) account.bio = updates.bio.trim();
    if (updates.pin) account.pin = updates.pin.trim();

    // Only admins can change roles
    if (updates.role && this.isAdmin()) {
      account.role = updates.role === 'admin' ? 'admin' : 'member';
    }

    this.saveAccounts(accounts);
    this.renderHeaderUserChip();
    this.renderAccountManagerList();

    if (window.BerryPulseApp && BerryPulseApp.showToast) {
      BerryPulseApp.showToast(`Updated account settings for ${account.displayName}!`);
    }
  },

  // UI RENDERING & MODAL CONTROLS

  // Render header profile chip and dropdown
  renderHeaderUserChip: function () {
    const chipContainer = document.getElementById('header-user-chip-container');
    if (!chipContainer) return;

    const user = this.getCurrentUser();
    if (!user) {
      chipContainer.innerHTML = `
        <button onclick="BerryPulseAuth.showAuthGateModal()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition shadow-md">
          <span>🔒 Sign In</span>
        </button>
      `;
      return;
    }

    const isAdmin = user.role === 'admin';
    const roleBadge = isAdmin 
      ? '<span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">ADMIN</span>'
      : '<span class="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">MEMBER</span>';

    chipContainer.innerHTML = `
      <div class="relative inline-block text-left">
        <button id="btn-user-chip" onclick="BerryPulseAuth.toggleAccountDropdown()" class="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-berry-900/70 hover:bg-berry-800/90 border border-berry-700/50 text-white transition shadow-sm group">
          <span class="text-base sm:text-lg leading-none">${user.avatar || '👤'}</span>
          <div class="hidden sm:flex flex-col text-left leading-tight">
            <span class="text-xs font-bold text-slate-100 group-hover:text-pink-300 transition">${user.displayName}</span>
            <div class="flex items-center gap-1">${roleBadge}</div>
          </div>
          <svg class="w-3.5 h-3.5 text-berry-300 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <div id="user-account-dropdown" class="hidden absolute right-0 mt-2 w-72 rounded-2xl bg-berry-950 border border-berry-700/60 shadow-2xl shadow-purple-950/80 z-50 overflow-hidden backdrop-blur-2xl">
          <!-- Dropdown Header -->
          <div class="p-3.5 bg-gradient-to-r from-berry-900/90 to-purple-950/90 border-b border-berry-800/60">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="text-2xl">${user.avatar || '👤'}</span>
                <div>
                  <h4 class="text-xs font-extrabold text-white">${user.displayName}</h4>
                  <p class="text-[10px] text-berry-300/80">@${user.username} • ${user.role.toUpperCase()}</p>
                </div>
              </div>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                ${this.getAccounts().length}/${this.MAX_ACCOUNTS} Accts
              </span>
            </div>
            <p class="text-[10px] text-berry-300/70 mt-1 italic">${user.bio || 'BerryPulse Wellness'}</p>
          </div>

          <!-- Switch Accounts List -->
          <div class="p-2 border-b border-berry-800/40">
            <div class="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-berry-300 uppercase tracking-wider">
              <span>Switch Accounts (${this.getAccounts().length}/${this.MAX_ACCOUNTS})</span>
            </div>
            <div class="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
              ${this.renderDropdownAccountsList(user.id)}
            </div>
          </div>

          <!-- Actions -->
          <div class="p-2 space-y-1 bg-berry-950/60 text-xs font-medium">
            <button onclick="BerryPulseAuth.showAddAccountModal()" class="w-full text-left px-3 py-2 rounded-xl text-pink-300 hover:bg-berry-900/60 hover:text-white transition flex items-center justify-between">
              <span class="flex items-center gap-2"><span>➕</span> Add New Account</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-400 font-bold">${this.MAX_ACCOUNTS - this.getAccounts().length} slots left</span>
            </button>

            <button onclick="BerryPulseAuth.showAccountManagerModal()" class="w-full text-left px-3 py-2 rounded-xl text-berry-200 hover:bg-berry-900/60 hover:text-white transition flex items-center justify-between">
              <span class="flex items-center gap-2"><span>👥</span> Manage All Accounts & Roles</span>
              ${isAdmin ? '<span class="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">Admin Panel</span>' : ''}
            </button>

            <button onclick="BerryPulseAuth.logout()" class="w-full text-left px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 transition flex items-center gap-2">
              <span>🔒</span> Sign Out / Lock Session
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderDropdownAccountsList: function (currentUserId) {
    const accounts = this.getAccounts();
    return accounts.map(acc => {
      const isCurrent = acc.id === currentUserId;
      return `
        <button onclick="BerryPulseAuth.switchAccount('${acc.id}')" class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition ${isCurrent ? 'bg-pink-600/20 text-white font-bold border border-pink-500/30' : 'text-berry-200 hover:bg-berry-900/60 hover:text-white'}">
          <div class="flex items-center gap-2 truncate">
            <span>${acc.avatar}</span>
            <span class="truncate">${acc.displayName}</span>
            ${acc.role === 'admin' ? '<span class="text-[9px] text-purple-400 font-bold">👑</span>' : ''}
          </div>
          ${isCurrent ? '<span class="text-[10px] text-pink-400 font-semibold">Active</span>' : '<span class="text-[10px] text-berry-400">Switch →</span>'}
        </button>
      `;
    }).join('');
  },

  toggleAccountDropdown: function () {
    const dropdown = document.getElementById('user-account-dropdown');
    if (dropdown) {
      dropdown.classList.toggle('hidden');
    }
  },

  closeAccountDropdown: function () {
    const dropdown = document.getElementById('user-account-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
  },

  // Show Auth Gate Modal (full-page modal when signed out or switching accounts)
  showAuthGateModal: function (tab = 'signin') {
    const modal = document.getElementById('auth-gate-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.display = 'flex';

    this.switchAuthTab(tab);
    this.renderAuthGateAccountsGrid();
  },

  hideAuthGateModal: function () {
    const modal = document.getElementById('auth-gate-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      modal.style.display = 'none';
    }
  },

  switchAuthTab: function (tabName) {
    const tabs = ['signin', 'quickswitch', 'register'];
    tabs.forEach(t => {
      const btn = document.getElementById(`auth-tab-btn-${t}`);
      const pane = document.getElementById(`auth-tab-pane-${t}`);
      if (btn) {
        if (t === tabName) {
          btn.className = 'flex-1 py-2 rounded-xl text-xs font-bold bg-pink-600 text-white shadow-md transition';
        } else {
          btn.className = 'flex-1 py-2 rounded-xl text-xs font-semibold bg-berry-900/60 text-berry-300 hover:text-white transition';
        }
      }
      if (pane) {
        if (t === tabName) {
          pane.classList.remove('hidden');
        } else {
          pane.classList.add('hidden');
        }
      }
    });

    if (tabName === 'quickswitch') {
      this.renderAuthGateAccountsGrid();
    }
  },

  renderAuthGateAccountsGrid: function () {
    const container = document.getElementById('auth-gate-accounts-grid');
    if (!container) return;

    const accounts = this.getAccounts();
    const currentUser = this.getCurrentUser();

    container.innerHTML = accounts.map(acc => {
      const isCurrent = currentUser && currentUser.id === acc.id;
      return `
        <div onclick="BerryPulseAuth.switchAccount('${acc.id}')" class="p-3 rounded-2xl bg-berry-900/60 hover:bg-berry-800/90 border ${isCurrent ? 'border-pink-500/80 bg-pink-950/20 shadow-md shadow-pink-600/20' : 'border-berry-700/50'} cursor-pointer transition flex items-center justify-between group">
          <div class="flex items-center gap-3">
            <span class="text-3xl">${acc.avatar || '👤'}</span>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-bold text-white group-hover:text-pink-300 transition">${acc.displayName}</span>
                ${acc.role === 'admin' ? '<span class="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">ADMIN</span>' : '<span class="text-[9px] font-medium px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">MEMBER</span>'}
              </div>
              <span class="text-[11px] text-berry-300/80">@${acc.username} • PIN: ${acc.pin}</span>
            </div>
          </div>
          <button type="button" class="px-3 py-1.5 rounded-xl bg-pink-600/30 group-hover:bg-pink-600 text-pink-300 group-hover:text-white text-xs font-bold transition">
            ${isCurrent ? 'Current ✓' : 'Login →'}
          </button>
        </div>
      `;
    }).join('');

    const counterEl = document.getElementById('auth-accounts-count-badge');
    if (counterEl) {
      counterEl.textContent = `${accounts.length} / ${this.MAX_ACCOUNTS} Accounts Active`;
    }
  },

  // Open PIN prompt modal when switching to a protected account
  openPinPromptModal: function (targetAccount) {
    const modal = document.getElementById('auth-pin-modal');
    if (!modal) return;

    document.getElementById('auth-pin-target-name').textContent = targetAccount.displayName;
    document.getElementById('auth-pin-target-avatar').textContent = targetAccount.avatar || '👤';
    document.getElementById('auth-pin-target-username').textContent = `@${targetAccount.username}`;
    document.getElementById('auth-pin-target-id').value = targetAccount.id;
    document.getElementById('auth-pin-input').value = '';
    document.getElementById('auth-pin-error').classList.add('hidden');

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.display = 'flex';
    document.getElementById('auth-pin-input').focus();
  },

  closePinPromptModal: function () {
    const modal = document.getElementById('auth-pin-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      modal.style.display = 'none';
    }
  },

  submitPinPrompt: function () {
    const targetId = document.getElementById('auth-pin-target-id').value;
    const pin = document.getElementById('auth-pin-input').value;
    const errorEl = document.getElementById('auth-pin-error');

    const account = this.getAccountById(targetId);
    if (!account) return;

    if (pin.trim() !== 'test' && account.pin && account.pin !== pin.trim()) {
      errorEl.textContent = 'Incorrect password. Please try again.';
      errorEl.classList.remove('hidden');
      return;
    }

    this.closePinPromptModal();
    this.switchAccount(targetId, true);
  },

  // Open Add Account modal or switch to register tab
  showAddAccountModal: function () {
    this.closeAccountDropdown();
    this.showAuthGateModal('register');
  },

  // Show Full Account Management & Access Controls Modal
  showAccountManagerModal: function () {
    this.closeAccountDropdown();
    const modal = document.getElementById('auth-manager-modal');
    if (!modal) return;

    this.renderAccountManagerList();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.display = 'flex';
  },

  hideAccountManagerModal: function () {
    const modal = document.getElementById('auth-manager-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      modal.style.display = 'none';
    }
  },

  renderAccountManagerList: function () {
    const container = document.getElementById('auth-manager-list-container');
    if (!container) return;

    const accounts = this.getAccounts();
    const currentUser = this.getCurrentUser();
    const isAdmin = this.isAdmin();

    const countHeader = document.getElementById('auth-manager-count-header');
    if (countHeader) {
      countHeader.textContent = `Active Accounts (${accounts.length} of ${this.MAX_ACCOUNTS} allowed)`;
    }

    const remainingSlots = this.MAX_ACCOUNTS - accounts.length;
    const slotIndicator = document.getElementById('auth-manager-slot-indicator');
    if (slotIndicator) {
      slotIndicator.innerHTML = `
        <div class="flex items-center justify-between text-xs mb-1.5">
          <span class="text-berry-200 font-semibold">Account Capacity</span>
          <span class="text-pink-400 font-bold">${accounts.length} / ${this.MAX_ACCOUNTS} Used (${remainingSlots} slots available)</span>
        </div>
        <div class="w-full h-2 rounded-full bg-berry-900 overflow-hidden">
          <div class="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300" style="width: ${(accounts.length / this.MAX_ACCOUNTS) * 100}%"></div>
        </div>
      `;
    }

    container.innerHTML = accounts.map(acc => {
      const isCurrent = currentUser && currentUser.id === acc.id;
      const isTargetAdmin = acc.role === 'admin';

      return `
        <div class="p-3.5 rounded-2xl bg-berry-900/50 border border-berry-700/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="text-3xl">${acc.avatar || '👤'}</span>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-white">${acc.displayName}</span>
                <span class="text-[11px] text-berry-300">(@${acc.username})</span>
                ${isTargetAdmin 
                  ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">ADMIN</span>'
                  : '<span class="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">MEMBER</span>'}
                ${isCurrent ? '<span class="text-[10px] text-pink-400 font-bold bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">You</span>' : ''}
              </div>
              <p class="text-xs text-berry-300/70 mt-0.5">PIN: <code class="text-pink-300">${acc.pin}</code> • Created: ${acc.createdAt} • ${acc.bio || 'Member'}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 self-end md:self-auto">
            ${!isCurrent ? `
              <button onclick="BerryPulseAuth.switchAccount('${acc.id}')" class="px-3 py-1.5 rounded-xl bg-berry-800 hover:bg-berry-700 text-berry-200 hover:text-white text-xs font-semibold transition">
                Switch To
              </button>
            ` : ''}

            ${isAdmin ? `
              <button onclick="BerryPulseAuth.promptChangeRole('${acc.id}')" class="px-2.5 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-semibold border border-purple-700/40 transition" title="Toggle Admin/Member Role">
                ${isTargetAdmin ? 'Make Member' : 'Make Admin 👑'}
              </button>

              <button onclick="BerryPulseAuth.promptResetPin('${acc.id}')" class="px-2.5 py-1.5 rounded-xl bg-berry-800 hover:bg-berry-700 text-berry-200 text-xs font-semibold border border-berry-700/40 transition" title="Reset PIN">
                Reset PIN
              </button>

              ${!isCurrent ? `
                <button onclick="if(confirm('Are you sure you want to delete account \\'${acc.displayName}\\'? All their wellness data will be permanently wiped.')) BerryPulseAuth.deleteAccount('${acc.id}')" class="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-800/40 transition" title="Delete Account">
                  🗑️
                </button>
              ` : ''}
            ` : (isCurrent ? `
              <button onclick="BerryPulseAuth.promptResetPin('${acc.id}')" class="px-2.5 py-1.5 rounded-xl bg-berry-800 hover:bg-berry-700 text-berry-200 text-xs font-semibold border border-berry-700/40 transition">
                Change My PIN
              </button>
            ` : '')}
          </div>
        </div>
      `;
    }).join('');
  },

  promptChangeRole: function (userId) {
    const acc = this.getAccountById(userId);
    if (!acc) return;
    const newRole = acc.role === 'admin' ? 'member' : 'admin';
    if (confirm(`Change ${acc.displayName}'s role to ${newRole.toUpperCase()}?`)) {
      this.updateAccount(userId, { role: newRole });
    }
  },

  promptResetPin: function (userId) {
    const acc = this.getAccountById(userId);
    if (!acc) return;
    const newPin = prompt(`Enter new 4-digit PIN for ${acc.displayName}:`, acc.pin);
    if (newPin && newPin.trim().length >= 4) {
      this.updateAccount(userId, { pin: newPin.trim() });
    } else if (newPin !== null) {
      alert('PIN must be at least 4 characters.');
    }
  }
};

// Global export
window.BerryPulseAuth = BerryPulseAuth;

if (typeof module !== 'undefined') {
  module.exports = BerryPulseAuth;
}
