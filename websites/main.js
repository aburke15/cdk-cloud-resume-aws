window.onload = async () => {
  document.getElementById('page-visit-count').innerHTML = await getPageVisitCount();
  console.log('Updated page visit count');
};

const pageVisitCountName = 'pageVisitCount';

const getPageVisitCountFromLambda = () => {
  // TODO: implement, call lambda function to get the page visit count
  // const url = 'https://some-url.from.amazon.com';
  // const response = await fetch(url);
  // const data = await response.json();
  // return data.pageVisitCount;
};

const getPageVisitCount = () => {
  if (localStorage.getItem(pageVisitCountName) === null) {
    localStorage.setItem(pageVisitCountName, 0);
  }

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

const updatePageVisitCount = () => {
  try {
    const pageVisitCount = parseInt(localStorage.getItem(pageVisitCountName)) + 1;
    localStorage.setItem(pageVisitCountName, pageVisitCount);
  } catch (error) {
    console.error('Error updatePageVisitCount:', error);
  }
};
