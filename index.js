// Firebase config ve başlatma
const firebaseConfig = {
  apiKey: "AIzaSyARQxDmh8UB3GuLBW-8ry2uxx2fe_GZcG8",
  authDomain: "akkv-agalar.firebaseapp.com",
  projectId: "akkv-agalar",
  storageBucket: "akkv-agalar.firebasestorage.app",
  messagingSenderId: "770615946763",
  appId: "1:770615946763:web:39d000efa05aa97173610e",
  measurementId: "G-H9K9RJ6X7N"
};

firebase.initializeApp(firebaseConfig);
// analytics opsiyonel
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
    // Kullanıcı adı ve şifreyi al
    const username = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    // Firebase için e-posta formatına çevir
    const email = username + "@akkv.abdul";

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        // Ortak belgeleri getir
        const docsSnap = await db.collection("documents").get();
        const documents = [];
        docsSnap.forEach(docSnap => {
            const data = docSnap.data();
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
            loginError.textContent = "Kullanıcı bulunamadı. Lütfen kullanıcı adınızı doğru girdiğinizden emin olun.";
        } else if (err.code === "auth/wrong-password") {
            loginError.textContent = "Şifre hatalı!";
        } else if (err.code === "auth/too-many-requests") {
            loginError.textContent = "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.";
        } else if (err.code === "auth/invalid-email") {
            loginError.textContent = "Geçersiz kullanıcı adı.";
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
