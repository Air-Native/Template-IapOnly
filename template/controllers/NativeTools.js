
import InAppReview from 'react-native-in-app-review';

const getReview = async () => {
	const reviewAvailable = InAppReview.isAvailable();
	if (reviewAvailable) {
		InAppReview.RequestInAppReview()
			.then((hasFlowFinishedSuccessfully) => {
				console.log(
					'InAppReview Successfully: ',
					hasFlowFinishedSuccessfully
				);
			})
			.catch((error) => {
				console.warn('InAppReview Error: ', error);
			});
	}
};

module.exports = {
    getReview,
};