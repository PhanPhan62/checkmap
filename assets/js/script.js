const auther = {
    name: "GrimCy",
    facebook: "https://www.facebook.com/yen.hoang.2903/",
}
function layNamHienTai() {
    const ngayHienTai = new Date();
    const nam = ngayHienTai.getFullYear();
    return nam;
}  
const year = layNamHienTai();

const map = L.map("map").setView([21.0070, 105.5090], 12);
const satelliteLayer = L.tileLayer("./proxy.php?z={z}&x={x}&y={y}", {
    attribution: `&copy; ${year} <a href=${auther.facebook}>${auther.name}</a>`,
    maxZoom: 22
}).addTo(map);

const roadsLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}", {}).addTo(map);

const overlayLayer = L.tileLayer("https://cdn.dandautu.vn/quy-hoach/du_an/hoa_lac__du_an/{z}/{x}/{y}.png", {
    maxZoom: 18,
    minZoom: 0,
    attribution: `&copy; ${year} <a href=${auther.facebook}>${auther.name}</a>`
}).addTo(map);

const opacityInput = document.getElementById("opacity");
opacityInput.addEventListener("input", function () {
    const opacity = opacityInput.value / 100;
    overlayLayer.setOpacity(opacity);
});

const toggleOverlayButton = document.getElementById("toggle-overlay");
let overlayVisible = true;
toggleOverlayButton.addEventListener("click", function () {
    overlayVisible = !overlayVisible;
    if (overlayVisible) {
        map.addLayer(overlayLayer);
        toggleOverlayButton.innerHTML = '<i class="fa-solid fa-map"></i>';
    } else {
        map.removeLayer(overlayLayer);
        toggleOverlayButton.innerHTML = '<i class="fa-regular fa-map"></i>';
    }
});


document.getElementById("zoom-in").addEventListener("click", () => map.zoomIn());
document.getElementById("zoom-out").addEventListener("click", () => map.zoomOut());
document.getElementById("fullscreen-btn").addEventListener("click", () => {
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
});

document.getElementById("toggle-sidebar-btn").addEventListener("click", function () {
    document.getElementById("sidebar").classList.toggle("toggled");
});

// Tạo biến để lưu marker vị trí
let locationMarker = null;
let locationCircle = null;

// Hàm kiểm tra quyền truy cập vị trí
async function checkLocationPermission() {
    try {
        // Kiểm tra xem trình duyệt có hỗ trợ Permissions API không
        if (!navigator.permissions || !navigator.permissions.query) {
            // Nếu không hỗ trợ, thử dùng geolocation trực tiếp
            return requestLocation();
        }

        // Kiểm tra trạng thái quyền truy cập
        const result = await navigator.permissions.query({ name: 'geolocation' });
        
        switch (result.state) {
            case 'granted':
                // Đã được cấp quyền, tiến hành lấy vị trí
                requestLocation();
                break;
            case 'prompt':
                // Chưa được cấp quyền, hiện prompt yêu cầu
                showPermissionPrompt();
                break;
            case 'denied':
                // Đã bị từ chối
                showPermissionDeniedMessage();
                break;
        }

        // Lắng nghe sự thay đổi trạng thái quyền
        result.addEventListener('change', function() {
            if (result.state === 'granted') {
                requestLocation();
            }
        });

    } catch (error) {
        console.error('Lỗi khi kiểm tra quyền:', error);
        // Trong trường hợp lỗi, thử dùng geolocation trực tiếp
        requestLocation();
    }
}

// Hàm hiển thị thông báo yêu cầu quyền
function showPermissionPrompt() {
    if (confirm('Ứng dụng cần quyền truy cập vị trí của bạn để hiển thị vị trí của bạn trên bản đồ. Bạn có muốn cho phép không?')) {
        requestLocation();
    }
}

// Hàm hiển thị thông báo khi quyền bị từ chối
function showPermissionDeniedMessage() {
    alert('Bạn đã từ chối quyền truy cập vị trí. Vui lòng cấp quyền trong cài đặt trình duyệt để sử dụng tính năng này.');
}

// Hàm yêu cầu vị trí
function requestLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const latlng = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                onLocationFound({latlng: latlng, accuracy: position.coords.accuracy});
            },
            function(error) {
                handleLocationError(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        alert("Trình duyệt của bạn không hỗ trợ Geolocation");
    }
}

// Hàm xử lý lỗi chi tiết
function handleLocationError(error) {
    let message;
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = "Bạn đã từ chối quyền truy cập vị trí. Vui lòng cấp quyền trong cài đặt trình duyệt để sử dụng tính năng này.";
            break;
        case error.POSITION_UNAVAILABLE:
            message = "Không thể xác định vị trí của bạn. Vui lòng kiểm tra kết nối GPS hoặc mạng.";
            break;
        case error.TIMEOUT:
            message = "Đã hết thời gian chờ khi lấy vị trí. Vui lòng thử lại.";
            break;
        default:
            message = "Có lỗi xảy ra khi lấy vị trí: " + error.message;
    }
    alert(message);
}

// Hàm xử lý khi nhận được vị trí
function onLocationFound(e) {
    const radius = e.accuracy / 2;
    const latlng = e.latlng;

    // Xóa marker cũ nếu có
    if (locationMarker) {
        map.removeLayer(locationMarker);
        map.removeLayer(locationCircle);
    }

    // Tạo marker mới
    locationMarker = L.marker(latlng).addTo(map)
        .bindPopup(`Bạn đang ở đây<br>Độ chính xác: ${radius.toFixed(0)} mét`).openPopup();

    // Tạo vòng tròn hiển thị độ chính xác
    locationCircle = L.circle(latlng, {
        radius: radius,
        color: '#3388ff',
        fillColor: '#3388ff',
        fillOpacity: 0.15
    }).addTo(map);

    // Di chuyển map đến vị trí người dùng
    map.setView(latlng, 16);
}

// Thêm sự kiện click cho nút location
document.getElementById('location-btn').addEventListener('click', function() {
    checkLocationPermission();
});