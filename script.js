// Nhúng bản đồ nền Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoiYmluaDg2IiwiYSI6ImNtNWtma2I3azBqOTIybHNmcDNldWQ3dTkifQ.obH8v6Lfuy8tfVeZmfBGcA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-streets-v12',
    projection: 'globe',
    zoom: 8,
    center: [108.11424446587102, 12.880850957736499]
});

// Thêm điều khiển điều hướng
map.on('load', function () {
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
});

// Thêm điều khiển định vị GPS
const geolocate = new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: false,
    showUserHeading: false
});
map.addControl(geolocate, 'top-right');
// cố đinh gps
    geolocate.trigger();

// Khi người dùng nhấn vào "Vị trí của tôi", hiển thị thông tin ngay tại vị trí định vị
let userPopup =null; // khai báo biến toàn cục để quản lý Pupup
geolocate.on('geolocate', function (e) {
    const userCoords = [e.coords.longitude, e.coords.latitude];
    // xóa Pupup cũ nếu tồn tại

    new mapboxgl.Popup()
        .setLngLat(userCoords) // Vị trí định vị
        .setHTML(`
            <h3>Vị trí của bạn</h3>
            <p><b>Tọa độ:</b> ${userCoords[0].toFixed(6)}, ${userCoords[1].toFixed(6)}</p>
            <p><b>Loại đất:</b> Thông tin chưa được cập nhật</p>
        `)
        .addTo(map);

    // Zoom vào vị trí định vị
    map.flyTo({ center: userCoords, zoom: 14, duration: 1000 });
});

// Ẩn/hiện danh sách tỉnh Tây Nguyên
function toggletaynguyenList(id) {
    document.querySelectorAll(".tinh-list").forEach(menu => {
        if (menu.id !== id) {
            menu.style.display = "none";
        }
    });

    let tinhList = document.getElementById(id);
    tinhList.style.display = (tinhList.style.display === "block") ? "none" : "block";
}

// Ẩn/hiện danh sách huyện Đắk Lắk
function toggledaklakList(id) {
    document.querySelectorAll(".huyen-list").forEach(menu => {
        if (menu.id !== id) {
            menu.style.display = "none";
        }
    });

    let huyenList = document.getElementById(id);
    if (huyenList) {
        huyenList.style.display = (huyenList.style.display === "block") ? "none" : "block";
    }
}

// Ẩn danh sách khi click ra ngoài sidebar
document.addEventListener("click", function (event) {
    let isClickInside = document.querySelector(".sidebar").contains(event.target);
    if (!isClickInside) {
        document.querySelectorAll(".tinh-list, .huyen-list").forEach(menu => {
            menu.style.display = "none";
        });
    }
});
// Ẩn danh sách khi click ra ngoài sidebar
function hideLists() {
    document.querySelectorAll('.tinh-list, .huyen-list').forEach(menu => {
        menu.style.display = 'none';
    });
}
document.addEventListener('click', function (event) {
    let isClickInside = document.querySelector('.sidebar')?.contains(event.target);
    if (!isClickInside) hideLists();
});

// Sau 3 giây sẽ thu lại toàn bộ danh sách
setTimeout(hideLists, 3000);
const colorMap = {
    'Krongpak': '#FF5733',
    'Eakar': '#33FF57'
};

// Xử lý sự kiện chọn huyện và tải GeoJSON
document.addEventListener("DOMContentLoaded", function () {
    const huyenRadios = document.querySelectorAll(".huyen-radio");

    huyenRadios.forEach(radio => {
        radio.addEventListener("change", function () {
            const selectedHuyen = this.value;
            const geojsonFile = selectedHuyen.toLowerCase() + ".geojson";
            const sourceId = selectedHuyen.toLowerCase();
            const layerId = sourceId + "-layer";
            // Dừng việc theo dõi vị trí của người dùng
            if (geolocate._watchState === "ACTIVE_LOCK") {
            geolocate._clearWatch();  // Ngừng theo dõi vị trí người dùng
            }
            // Xóa các source/layer cũ trước khi thêm mới
            huyenRadios.forEach(r => {
                const oldSourceId = r.value.toLowerCase();
                const oldLayerId = oldSourceId + "-layer";

                if (map.getLayer(oldLayerId)) {
                    map.removeLayer(oldLayerId);
                }
                if (map.getSource(oldSourceId)) {
                    map.removeSource(oldSourceId);
                }
            });

            // Tải GeoJSON và zoom đến huyện
            fetch(geojsonFile)
                .then(response => response.json())
                .then(data => {
                    // Thêm nguồn dữ liệu vào bản đồ
                    map.addSource(sourceId, {
                        type: "geojson",
                        data: data
                    });

                    // Thêm lớp bản đồ
                    map.addLayer({
                        id: layerId,
                        type: "fill",
                        source: sourceId,
                        paint: {
                            "fill-color": "#" + Math.floor(Math.random() * 16777215).toString(16),
                            "fill-opacity": 0.5
                        }
                    });

                    // Kiểm tra nếu GeoJSON có bbox thì sử dụng để zoom
                    if (data.features.length > 0 && data.features[0].properties.center) {
                        const center = data.features[0].properties.center;
                        const zoomLevel = data.features[0].properties.zoom || 12;
                        map.flyTo({ center: center, zoom: zoomLevel, duration: 1000 });
                    }
                })
                .catch(error => console.error("Lỗi khi tải GeoJSON:", error));
        });
    });
});

// Khi người dùng click vào bản đồ, hiển thị thông tin tại vị trí đó
map.on("click", function (e) {
    new mapboxgl.Popup()
        .setLngLat(e.lngLat) // Vị trí nhấp chuột
        .setHTML(`
            <h3>Thông tin vị trí</h3>
            <p><b>Tọa độ:</b> ${e.lngLat.lng.toFixed(6)}, ${e.lngLat.lat.toFixed(6)}</p>
            <p> Thông tin chưa được cập nhật</p>
        `)
        .addTo(map);
});










