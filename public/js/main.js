// Script utama untuk sistem presensi QR dengan UI modern
document.addEventListener('DOMContentLoaded', function() {
    const nameInput = document.getElementById('name');
    const nikInput = document.getElementById('nik');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const statusMessage = document.getElementById('statusMessage');
    const currentDateEl = document.getElementById('currentDate');
    const clockTimeEl = document.getElementById('clockTime');
    
    // URL endpoint Google Apps Script - PASTIKAN INI SUDAH BENAR
    const scriptURL = 'https://corsproxy.io/?https://script.google.com/macros/s/AKfycbxmwV5dy2vJn4ItGlBC7YnOYxEQ0jjrFM1DofYTIApyQ8JaiRx9PHC-r_Bg_ScPIupiUQ/exec';
    
    // Fungsi untuk membuat efek neuron network
    function createNeuronNetwork() {
        const particleContainer = document.querySelector('.particles');
        
        // Hapus elemen yang ada
        particleContainer.innerHTML = '';
        
        // Buat node-node neuron (30-50 node)
        const nodeCount = 40;
        const nodes = [];
        
        for (let i = 0; i < nodeCount; i++) {
            const node = document.createElement('div');
            node.classList.add('particle-node');
            
            // Posisi acak
            const top = Math.random() * 100;
            const left = Math.random() * 100;
            
            node.style.top = `${top}%`;
            node.style.left = `${left}%`;
            
            // Ukuran acak untuk beberapa node
            if (Math.random() > 0.7) {
                const size = 2 + Math.random() * 3;
                node.style.width = `${size}px`;
                node.style.height = `${size}px`;
            }
            
            particleContainer.appendChild(node);
            nodes.push({
                element: node,
                x: left,
                y: top,
                vx: (Math.random() - 0.5) * 0.05, // kecepatan x
                vy: (Math.random() - 0.5) * 0.05, // kecepatan y
                connections: []
            });
        }
        
        // Buat koneksi antar node
        for (let i = 0; i < nodes.length; i++) {
            const nodeA = nodes[i];
            
            // Setiap node terhubung dengan 2-5 node terdekat
            const maxConnections = 2 + Math.floor(Math.random() * 4);
            
            // Hitung jarak ke semua node lain
            const distances = [];
            
            for (let j = 0; j < nodes.length; j++) {
                if (i !== j) {
                    const nodeB = nodes[j];
                    const dx = nodeA.x - nodeB.x;
                    const dy = nodeA.y - nodeB.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    distances.push({
                        index: j,
                        distance: distance
                    });
                }
            }
            
            // Urutkan berdasarkan jarak
            distances.sort((a, b) => a.distance - b.distance);
            
            // Ambil n node terdekat
            const connectionsCount = Math.min(maxConnections, distances.length);
            
            for (let k = 0; k < connectionsCount; k++) {
                const nodeB = nodes[distances[k].index];
                
                // Buat elemen koneksi
                const connection = document.createElement('div');
                connection.classList.add('neuron-connection');
                
                // Hitung properti untuk koneksi
                const dx = nodeB.x - nodeA.x;
                const dy = nodeB.y - nodeA.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                
                // Set posisi dan properti
                connection.style.width = `${distance}%`;
                connection.style.top = `${nodeA.y + 0.1}%`; // Sedikit offset untuk lebih baik
                connection.style.left = `${nodeA.x + 0.1}%`;
                connection.style.transform = `rotate(${angle}deg)`;
                connection.style.opacity = (1 - distance / 100) * 0.5; // Memudar dengan jarak
                
                particleContainer.appendChild(connection);
                
                // Simpan koneksi
                nodeA.connections.push({
                    element: connection,
                    targetNode: nodeB
                });
            }
        }
        
        // Animasi pergerakan node
        function animateNodes() {
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                
                // Update posisi
                node.x += node.vx;
                node.y += node.vy;
                
                // Batasi supaya tidak keluar layar
                if (node.x > 100) {
                    node.x = 100;
                    node.vx *= -1;
                }
                if (node.x < 0) {
                    node.x = 0;
                    node.vx *= -1;
                }
                if (node.y > 100) {
                    node.y = 100;
                    node.vy *= -1;
                }
                if (node.y < 0) {
                    node.y = 0;
                    node.vy *= -1;
                }
                
                // Update DOM
                node.element.style.left = `${node.x}%`;
                node.element.style.top = `${node.y}%`;
                
                // Update koneksi
                for (let j = 0; j < node.connections.length; j++) {
                    const connection = node.connections[j];
                    const targetNode = connection.targetNode;
                    
                    // Hitung ulang properti
                    const dx = targetNode.x - node.x;
                    const dy = targetNode.y - node.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                    
                    // Update DOM
                    connection.element.style.width = `${distance}%`;
                    connection.element.style.top = `${node.y + 0.1}%`;
                    connection.element.style.left = `${node.x + 0.1}%`;
                    connection.element.style.transform = `rotate(${angle}deg)`;
                    connection.element.style.opacity = (1 - distance / 100) * 0.5;
                }
            }
            
            requestAnimationFrame(animateNodes);
        }
        
        // Mulai animasi
        animateNodes();
    }
    
    // Inisialisasi neuron network
    createNeuronNetwork();
    
    // Format tanggal dan waktu
    function formatDate(date) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('id-ID', options);
    }
    
    function formatTime(date) {
        return date.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false 
        });
    }
    
    // Update tampilan tanggal dan waktu
    function updateCurrentTime() {
        const now = new Date();
        currentDateEl.textContent = formatDate(now);
        clockTimeEl.textContent = formatTime(now);
    }
    
    // Update waktu setiap detik
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // Fungsi untuk mengatur status tombol berdasarkan waktu
    function updateButtonStatus() {
        const currentHour = new Date().getHours();
        
        // Asumsi:
        // - Login: 06:00 - 12:00
        // - Logout: 12:00 - 21:00
        // - Shift malam bisa menggunakan sistem yang sama
        
        if (currentHour >= 6 && currentHour < 12) {
            loginBtn.classList.remove('disabled');
            logoutBtn.classList.add('disabled');
        } else if (currentHour >= 12 && currentHour < 21) {
            loginBtn.classList.add('disabled');
            logoutBtn.classList.remove('disabled');
        } else {
            // Di luar jam kerja, kedua tombol aktif untuk mengakomodasi shift malam
            loginBtn.classList.remove('disabled');
            logoutBtn.classList.remove('disabled');
        }
    }
    
    // Update status tombol saat halaman dimuat
    updateButtonStatus();
    
    // Validasi input dengan animasi
    function validateInput() {
        let isValid = true;
        
        if (!nameInput.value.trim()) {
            showStatus('Nama tidak boleh kosong!', 'error');
            nameInput.focus();
            nameInput.style.animation = 'shake 0.5s';
            setTimeout(() => {
                nameInput.style.animation = '';
            }, 500);
            isValid = false;
        }
        
        if (!nikInput.value.trim()) {
            if (isValid) {
                showStatus('NIK tidak boleh kosong!', 'error');
                nikInput.focus();
            }
            nikInput.style.animation = 'shake 0.5s';
            setTimeout(() => {
                nikInput.style.animation = '';
            }, 500);
            isValid = false;
        }
        
        return isValid;
    }
    
    // Fungsi untuk menampilkan pesan status dengan animasi
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status ' + type;
        statusMessage.style.display = 'block';
        
        // Animas fade in
        statusMessage.style.opacity = '0';
        statusMessage.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            statusMessage.style.opacity = '1';
            statusMessage.style.transform = 'translateY(0)';
        }, 10);
        
        // Sembunyikan pesan setelah 5 detik
        setTimeout(() => {
            statusMessage.style.opacity = '0';
            statusMessage.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 300);
        }, 5000);
    }
    
    // Menambahkan efek ripple pada tombol
    function createRipple(event) {
        const button = event.currentTarget;
        
        if (button.classList.contains('disabled')) return;
        
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        
        const rect = button.getBoundingClientRect();
        
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add('ripple');
        
        const ripple = button.getElementsByClassName('ripple')[0];
        
        if (ripple) {
            ripple.remove();
        }
        
        button.appendChild(circle);
    }
    
    // Tambahkan event listener untuk ripple effect
    loginBtn.addEventListener('click', createRipple);
    logoutBtn.addEventListener('click', createRipple);
    
    // Handler untuk tombol Login
    loginBtn.addEventListener('click', function(e) {
        if (loginBtn.classList.contains('disabled')) return;
        
        if (!validateInput()) return;
        
        const now = new Date();
        const data = {
            name: nameInput.value.trim(),
            nik: nikInput.value.trim(),
            loginTime: now.toLocaleString('id-ID'),
            logoutTime: '',
            action: 'login'
        };
        
        // Tampilkan loading state
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        // Kirim data ke Google Apps Script
        sendDataToSheet(data);
    });
    
    // Handler untuk tombol Logout
    logoutBtn.addEventListener('click', function(e) {
        if (logoutBtn.classList.contains('disabled')) return;
        
        if (!validateInput()) return;
        
        const now = new Date();
        const data = {
            name: nameInput.value.trim(),
            nik: nikInput.value.trim(),
            logoutTime: now.toLocaleString('id-ID'),
            action: 'logout'
        };
        
        // Tampilkan loading state
        logoutBtn.disabled = true;
        logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        // Kirim data ke Google Apps Script
        sendDataToSheet(data);
    });
    
    // Fungsi untuk mengirim data ke Google Sheet dengan form submission
    function sendDataToSheet(data) {
        // Tampilkan loading state
        const activeBtn = data.action === 'login' ? loginBtn : logoutBtn;
        activeBtn.disabled = true;
        activeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        // Pastikan waktu dalam format yang benar
        if (data.action === 'login') {
            data.loginTime = new Date().toLocaleString('id-ID');
        } else {
            data.logoutTime = new Date().toLocaleString('id-ID');
        }
        
        // URL Google Apps Script
        const scriptURL = 'https://script.google.com/macros/s/AKfycbxmwV5dy2vJn4ItGlBC7YnOYxEQ0jjrFM1DofYTIApyQ8JaiRx9PHC-r_Bg_ScPIupiUQ/exec';
        
        // Buat iframe tersembunyi untuk target form
        let targetFrame = document.getElementById('hidden_frame');
        if (!targetFrame) {
            targetFrame = document.createElement('iframe');
            targetFrame.id = 'hidden_frame';
            targetFrame.name = 'hidden_frame';
            targetFrame.style.display = 'none';
            document.body.appendChild(targetFrame);
        }
        
        // Buat form untuk dikirim
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = scriptURL;
        form.target = 'hidden_frame';
        form.style.display = 'none';
        
        // Tambahkan data ke form
        for (const key in data) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
            form.appendChild(input);
        }
        
        // Tambahkan form ke dokumen dan submit
        document.body.appendChild(form);
        
        console.log('Mengirim data:', data); // Tambahkan log untuk debugging
        form.submit();
        
        // Tampilkan pesan sukses setelah beberapa detik (simulasi)
        setTimeout(() => {
            // Reset button state
            activeBtn.disabled = false;
            activeBtn.innerHTML = data.action === 'login' ? 
                '<i class="fas fa-sign-in-alt"></i> Login' : 
                '<i class="fas fa-sign-out-alt"></i> Logout';
            
            // Tampilkan pesan sukses
            const actionType = data.action === 'login' ? 'Login' : 'Logout';
            showStatus(`${actionType} berhasil!`, 'success');
            
            // Reset form setelah berhasil logout
            if (data.action === 'logout') {
                setTimeout(() => {
                    nameInput.value = '';
                    nikInput.value = '';
                }, 2000);
            }
            
            // Hapus form setelah digunakan
            document.body.removeChild(form);
        }, 2000);
    }
    
    // Input focus dan blur effects
    nameInput.addEventListener('focus', function() {
        this.parentElement.classList.add('input-focused');
    });
    
    nameInput.addEventListener('blur', function() {
        this.parentElement.classList.remove('input-focused');
    });
    
    nikInput.addEventListener('focus', function() {
        this.parentElement.classList.add('input-focused');
    });
    
    nikInput.addEventListener('blur', function() {
        this.parentElement.classList.remove('input-focused');
    });
    
    // Menambahkan tombol keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Enter untuk submit form
        if (e.key === 'Enter') {
            // Jika tombol login tidak disabled, klik tombol login
            if (!loginBtn.classList.contains('disabled')) {
                loginBtn.click();
            } 
            // Jika tombol logout tidak disabled, klik tombol logout
            else if (!logoutBtn.classList.contains('disabled')) {
                logoutBtn.click();
            }
        }
    });
});