import axios from "axios";
import { useEffect, useState } from "react";
//Компонент Pagination принимает четыре пропса: `total` (общее количество элементов),
//`itemsPerPage` (количество элементов на странице), `currentPage` (текущая страница), и `onPageChange` (функция для обработки изменения страницы)
const Pagination = ({ total, itemsPerPage, currentPage, onPageChange }) => {
  //Здесь вычисляется общее количество страниц (`pageCount`) путём деления общего количества элементов (`total`) на количество элементов на странице (`itemsPerPage`)
  //и округления результата в большую сторону.
  const pageCount = Math.ceil(total / itemsPerPage);
  //Определяются константы для первой (`firstPage`) и последней (`lastPage`) страницы.
  const firstPage = 1;
  const lastPage = pageCount;
  // Максимальное количество отображаемых кнопок страниц
  const maxPageButtonCount = 5;
  // Вычисляются начальная (`startPage`) и конечная (`endPage`) страницы для отображения, исходя из текущей страницы (`currentPage`) и максимального количества кнопок.
  let startPage = Math.max(
    firstPage,
    currentPage - Math.floor(maxPageButtonCount / 2)
  );
  let endPage = Math.min(lastPage, startPage + maxPageButtonCount - 1);

  //Если конечная страница (`endPage`) совпадает с последней страницей (`lastPage`), то начальная страница (`startPage`) корректируется так, чтобы всегда отображалось пять кнопок.
  if (endPage === lastPage) {
    startPage = Math.max(firstPage, lastPage - maxPageButtonCount + 1);
  }
  return (
    <div>
      {/* Кнопка назад */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === firstPage}
      >
        Назад
      </button>
      {/* Кнопка "Назад", которая вызывает функцию `onPageChange` с номером предыдущей страницы. Она неактивна (`disabled`), если текущая страница является первой. */}
      {startPage > firstPage && (
        //Если начальная страница для отображения (`startPage`) больше первой страницы (`firstPage`), то отображается кнопка для первой страницы и многоточие, указывающее на пропуск страниц.
        <>
          <button onClick={() => onPageChange(firstPage)}>{firstPage}</button>
          <span>...</span>
        </>
      )}
      {/*Создаётся массив кнопок для видимых страниц, начиная от `startPage` до `endPage`. Каждая кнопка вызывает `onPageChange` с соответствующим номером страницы.*/}
      {[...Array(endPage - startPage + 1)].map((_, index) => (
        <button
          key={index}
          onClick={() => onPageChange(startPage + index)}
          disabled={currentPage === startPage + index}
        >
          {startPage + index}
        </button>
      ))}
      {/* Если конечная страница для отображения (`endPage`) меньше последней страницы (`lastPage`), то отображается многоточие и кнопка для последней страницы. */}
      {endPage < lastPage && (
        <>
          <span>...</span>
          <button onClick={() => onPageChange(lastPage)}>{lastPage}</button>
        </>
      )}
      {/* Кнопка "Вперёд", которая вызывает функцию `onPageChange` с номером следующей страницы. Она неактивна (`disabled`), если текущая страница является последней. */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === lastPage}
      >
        Вперёд
      </button>
    </div>
  );
};
//сортировка по алфавиту для чекбокса. Передаю массив объектов, чтобы получить отсортированный массив.
//как-то вызвать перед рендерингом, чтобы отобразить алфавитный порядок

// Основной компонент App
const sortAlphabetically = (data) => {
  return data.sort((a, b) => {
    if (a.title < b.title) {
      return -1;
    }
    if (a.title > b.title) {
      return 1;
    }
    return 0;
  });
};
const Checkbox = ({ onSortChange }) => {
  return (
    <label className="checkbox">
      <input
        type="checkbox"
        className="checkbox-element"
        onChange={onSortChange}
      />
      <div>Отсортировать в алфавитном порядке</div>
    </label>
  );
};
const App = () => {
  const [news, setNews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [fetching, setFetching] = useState(true);
  const [onChecked, setOnChecked] = useState(false);
  const [originalNews, setOriginalNews] = useState([]);
  const itemsPerPage = 5;
  // Получение новостей с Hacker News
  const getNews = async (page) => {
    setFetching(true);
    try {
      const res = await axios.get(`https://hacker-news.firebaseio.com/v0/newstories.json?print=pretty`);
      if (res.status === 200) {
        const storyIds = res.data;
        if (Array.isArray(storyIds)) {
          const newsPromises = storyIds.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((id) =>
            axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json?print=pretty`)
          );
          const newsStories = await Promise.all(newsPromises);
          const formattedNews = newsStories.map((story) => ({
            title: story.data.title,
            by: story.data.by,
            score: story.data.score,
            time: new Date(story.data.time * 1000).toLocaleString(),
          }));
          setNews(formattedNews);
          setOriginalNews(formattedNews); // Сохраняем исходные данные
        } else {
          alert("Ошибка " + res.status);
        }
      }
    } catch (error) {
      console.error("Ошибка при получении данных:", error);
    }
    setFetching(false);
  };
  // Побочный эффект для получения новостей при изменении currentPage
  useEffect(() => {
    getNews(currentPage);
  }, [currentPage]);
  // Обработчик изменения страницы
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setFetching(true);
  };
  // Обработчик изменения состояния чекбокса
  const handleSortChange = (e) => {
    setOnChecked(e.target.checked);
    if (e.target.checked) {
      setNews(sortAlphabetically([...news]));
    } else {
      setNews([...originalNews]);
    }
  };
  // Состояние и фильтрация новостей по поисковому запросу
  const [value, setValue] = useState("");
  const filteredNews = news.filter((newsItem) => {
    return newsItem.title.toLowerCase().includes(value.toLowerCase());
  });
  // Рендеринг компонента
  return (
 <div className="home">
 <div className="left">Hacker News</div>
 <div className="right">Главная</div>
 <Pagination
        total={5000} // Общее количество новостей (пример)
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
 <form className="form">
 <input
          type="search"
          placeholder="Поиск"
          onChange={(event) => setValue(event.target.value)}
        />
 <button className="imageButton" />
 <button className="button" onClick={() => getNews(currentPage)}>
          Обновить ленту
 </button>
 <Checkbox onSortChange={handleSortChange} />
 </form>
      {onChecked
        ? sortAlphabetically(filteredNews).map((item, index) => (
 <div key={index}>
 <h3>{item.title}</h3>
 <p>Автор: {item.by}</p>
 <p>Время: {item.time}</p>
 <p>Рейтинг: {item.score}</p>
 </div>
          ))
        : filteredNews.map((item, index) => (
 <div key={index}>
 <h3>{item.title}</h3>
 <p>Автор: {item.by}</p>
 <p>Время: {item.time}</p>
 <p>Рейтинг: {item.score}</p>
 </div>
          ))}
 </div>
  );
 };
 export default App;