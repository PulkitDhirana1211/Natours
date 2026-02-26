export const displayMap = (locations) => {
    const mapElement = document.getElementById('map');
    const token = mapElement.dataset.token;
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
    });

    map.on('load', () => {
        // const locations = JSON.parse(document.getElementById('map').dataset.locations);
        const bounds = new mapboxgl.LngLatBounds();

        locations.forEach(loc => {
            const el = document.createElement('div');
            el.className = 'marker';

            new mapboxgl.Marker({
                element: el,
                anchor: 'bottom'
            })
                .setLngLat(loc.coordinates)
                .addTo(map);

            new mapboxgl.Popup({ offset: 30 })
                .setLngLat(loc.coordinates)
                .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
                .addTo(map);

            bounds.extend(loc.coordinates);
        });

        // Important: Only fit if we actually have bounds
        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, {
                padding: {
                    top: 200,
                    bottom: 150,
                    left: 100,
                    right: 100
                }
            });
        }
    });

}

