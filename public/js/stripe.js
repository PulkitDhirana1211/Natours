import axios from "axios";
import { showAlert } from './alerts';


export const bookTour = async tourID => {
    try {
        // Get checkout session from API
        const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourID}`);
        // Create checkout form + charge credit card
        console.log(session);

        window.location.href = session.data.session.url;
    } catch (err) {
        console.log(err);
        showAlert('error', err);
    }
}