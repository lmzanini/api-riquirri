function sortByFullName(a, b) {
  if (!a.nome_completo) {
    return -1; // Se 'a' não tem nome completo, considera que vem antes de 'b'
  } else if (!b.nome_completo) {
    return 1; // Se 'b' não tem nome completo, considera que vem antes de 'a'
  } else {
    return a.nome_completo.localeCompare(b.nome_completo); // Ordena por nome completo
  }
}


function calculatePagination(totalItems, currentPage, pageSize, maxPagesDisplayed) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPageNumber = parseInt(currentPage, 10) || 1;

  if (currentPageNumber < 1 || currentPageNumber > totalPages) {
    throw new Error('Invalid page number');
  }

  const startPage = Math.max(1, currentPageNumber - Math.floor(maxPagesDisplayed / 2));
  let endPage = startPage + maxPagesDisplayed - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxPagesDisplayed + 1);
  }

  const startIndex = (currentPageNumber - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return {
    totalItems,
    currentPage: currentPageNumber,
    pageSize,
    totalPages,
    startPage,
    endPage,
    startIndex,
    endIndex,
    pages,
  };
}


module.exports = {
  sortByFullName,
  calculatePagination
};
