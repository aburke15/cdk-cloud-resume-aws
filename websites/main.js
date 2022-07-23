window.onload = async () => {
  document.getElementById('page-visit-count').innerHTML = await getPageVisitCountFromLambda();
  console.log('Updated page visit count');
};

const pageVisitCountName = 'pageVisitCount';

const getPageVisitCountFromLambda = async () => {
  try {
    const url = 'https://5k2y7v67ra.execute-api.us-west-2.amazonaws.com/prod/count';
    const response = await fetch(url);

    const json = await response.json();
    const data = JSON.parse(json);

    return data.body.count;
  } catch (error) {
    console.error('Error getPageVisitCountFromLambda:', error);
    return 0;
  }
};

// Local storage access only
const getPageVisitCount = () => {
  setPageVisitCountIfNotExists();
  updatePageVisitCount();

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(localStorage.getItem(pageVisitCountName));
      } catch (error) {
        console.error('Error getPageVisitCount:', error);
        reject(error);
      }
    }, 200);
  });
};

const setPageVisitCountIfNotExists = () => {
  if (localStorage.getItem(pageVisitCountName) === null) {
    localStorage.setItem(pageVisitCountName, 0);
  }
};

const updatePageVisitCount = () => {
  try {
    const pageVisitCount = parseInt(localStorage.getItem(pageVisitCountName)) + 1;
    localStorage.setItem(pageVisitCountName, pageVisitCount);
  } catch (error) {
    console.error('Error updatePageVisitCount:', error);
  }
};
