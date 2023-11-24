var express = require('express');
var router = express.Router();

const reviews = require('../data/reviews.json');

router.get('/', async (req, res) => {
  const { filters, fields, populate, sort, pagination } = req.query;

  const filteredResult = filters
    ? reviews.filter((review) => {
        let result = false;
        for ([key, options] of Object.entries(filters)) {
          if (result) break;
          for ([rule, query] of Object.entries(options)) {
            if (result) break;
            switch (rule) {
              case '$eq':
                result = review[key] === query;
                break;
              case '$containsi':
                result = review[key]
                  .toLowerCase()
                  .includes(query.toLowerCase());
                break;
              default:
                break;
            }
          }
        }
        return result;
      })
    : reviews;

  const compare = (a, b, keys) => {
    if (keys.length === 0) return 0;
    const [key, direction = 'asc'] = keys[0].split(':');
    if (typeof a[key] === 'string') {
      const result = a[key].localeCompare(b[key]);
      if (result === 0) return compare(a, b, keys.slice(1));
      else return result;
    } else {
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      return compare(a, b, keys.slice(1));
    }
  };

  filteredResult.sort((a, b) => compare(a, b, sort));

  const serializedResult = filteredResult.map((review) => {
    const attributes = {};

    !!fields &&
      fields.forEach((field) => {
        switch (field) {
          case 'id':
            attributes.id = review.id;
            break;
          case 'slug':
            attributes.slug = review.slug;
            break;
          case 'title':
            attributes.title = review.title;
            break;
          case 'body':
            attributes.body = review.body;
            break;
          case 'subtitle':
            attributes.subtitle = review.subtitle;
            break;
          case 'publishedAt':
            reviews;
            attributes.publishedAt = new Date(review.publishedAt).toISOString();
            break;
          default:
            break;
        }
      });

    !!populate &&
      Object.entries(populate).forEach(([key, options]) => {
        switch (key) {
          case 'image': {
            attributes.image = {
              data: {
                attributes: options.fields.reduce((acc, field) => {
                  switch (field) {
                    case 'url':
                      acc.url = `uploads/${review.url}`;
                      break;
                    default:
                      break;
                  }
                  return acc;
                }, {}),
              },
            };
            break;
          }
          default:
            break;
        }
      });

    return {
      attributes,
    };
  });

  const chunk = (input, size) => {
    return input.reduce((arr, item, idx) => {
      return idx % size === 0
        ? [...arr, [item]]
        : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
    }, []);
  };

  if (pagination) {
    const pagedResult = chunk(serializedResult, pagination.pageSize);

    res.send({
      data: pagedResult[(pagination.page ?? 1) - 1] ?? [],
      meta: {
        pagination: { pageCount: pagedResult.length },
      },
    });
    return;
  }

  res.send({
    data: serializedResult,
    meta: {
      pagination: { pageCount: 1 },
    },
  });
});

module.exports = router;
