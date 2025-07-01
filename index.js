// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBxpPjg8XuHCYmGyUbvtbi7TGox-zS0-Dc",
  authDomain: "sayek-bis.firebaseapp.com",
  projectId: "sayek-bis",
  storageBucket: "sayek-bis.firebasestorage.app",
  messagingSenderId: "925597557145",
  appId: "1:925597557145:web:49ee5aeb20e42ce1f4f308",
  measurementId: "G-R9KXLMZPJY"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// analytics opsiyonel, gerekirse ekleyebilirsin
// const analytics = firebase.analytics();

const auth = firebase.auth();
const db = firebase.firestore();

const loginForm = document.getElementById("login-form");
const loginPanel = document.getElementById("login-panel");
const documentsPanel = document.getElementById("documents-panel");
const documentsList = document.getElementById("documents-list");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");

// Modal ve PDF frame elementlerini seç
const pdfModal = document.getElementById("pdf-modal");
const pdfFrame = document.getElementById("pdf-frame");
const closeModal = document.getElementById("close-modal");

loginForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const code = document.getElementById("code").value.trim();

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const userId = userCredential.user.uid;

        // Hata ayıklama için UID ve e-posta konsola yazılsın
        console.log("Giriş yapan UID:", userId, "E-posta:", email);

        // Kullanıcıya ait doğrulama kodunu Firestore'dan kontrol et
        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) {
            loginError.textContent = "Firestore'da kullanıcı belgesi bulunamadı. UID: " + userId;
            await auth.signOut();
            return;
        }
        if (userDoc.data().verificationCode !== code) {
            loginError.textContent = "Doğrulama kodu hatalı!";
            await auth.signOut();
            return;
        }

        // Belgeleri getir
        const docsSnap = await db.collection("users").doc(userId).collection("documents").get();
        const documents = [];
        docsSnap.forEach(doc => {
            const data = doc.data();
            // name ve url varsa obje olarak ekle, yoksa sadece name
            if (data.name && data.url) {
                documents.push({ name: data.name, url: data.url });
            } else if (data.name) {
                documents.push(data.name);
            }
        });
        showDocuments(documents);

        loginPanel.style.display = "none";
        documentsPanel.style.display = "block";
        loginError.textContent = "";
    } catch (err) {
        console.error(err);
        if (err.code === "auth/user-not-found") {
            loginError.textContent = "Kullanıcı bulunamadı. Lütfen e-posta adresinizi doğru girdiğinizden emin olun.";
        } else if (err.code === "auth/wrong-password") {
            loginError.textContent = "Şifre hatalı!";
        } else if (err.code === "auth/too-many-requests") {
            loginError.textContent = "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.";
        } else if (err.code === "auth/invalid-email") {
            loginError.textContent = "Geçersiz e-posta adresi.";
        } else {
            loginError.textContent = "Giriş yapılamadı: " + err.message;
        }
    }
});

function showDocuments(documents) {
    documentsList.innerHTML = "";
    if (documents.length === 0) {
        const info = document.createElement("li");
        info.className = "info";
        info.textContent = "Kayıtlı herhangi bir belge bulunmamaktadır.";
        documentsList.appendChild(info);
    } else {
        documents.forEach(doc => {
            const li = document.createElement("li");
            if (typeof doc === "string") {
                if (doc.includes("|")) {
                    const [name, url] = doc.split("|");
                    const a = document.createElement("a");
                    a.href = "#";
                    a.textContent = name;
                    a.onclick = function(e) {
                        e.preventDefault();
                        window.open(
                            url,
                            '_blank',
                            'width=900,height=700,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
                        );
                    };
                    li.appendChild(a);
                } else {
                    li.textContent = doc;
                }
            } else if (doc.name && doc.url) {
                const a = document.createElement("a");
                a.href = "#";
                a.textContent = doc.name;
                a.onclick = function(e) {
                    e.preventDefault();
                    window.open(
                        doc.url,
                        '_blank',
                        'width=900,height=700,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
                    );
                };
                li.appendChild(a);
            } else {
                li.textContent = doc.name || "Bilinmeyen Belge";
            }
            documentsList.appendChild(li);
        });
    }
}

// Modal kapatma
closeModal.onclick = function() {
    pdfModal.style.display = "none";
    pdfFrame.src = "";
};

// Modal dışında tıklayınca kapansın
window.onclick = function(event) {
    if (event.target === pdfModal) {
        pdfModal.style.display = "none";
        pdfFrame.src = "";
    }
}

logoutBtn.addEventListener("click", async function() {
    await auth.signOut();
    documentsPanel.style.display = "none";
    loginPanel.style.display = "block";
    loginForm.reset();
});