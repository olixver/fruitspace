# fruit plate.

The fruit plate site. No Framer, no build step: just these files.

- `index.html` is the whole site (layout, drag logic, checkout popup)
- `fruits.js` is the fruit list (only add new fruits to the END)

## Putting it online (Vercel)

1. Create a new repository on github.com (name it something like `fruitplate`).
2. On the empty repo page, click "uploading an existing file" and drag in every file from this folder. Click "Commit changes".
3. On vercel.com, click "Add New… → Project", pick the repo, and click Deploy. No settings needed.
4. Check the `.vercel.app` address it gives you, then add your domain under Project → Settings → Domains.

Any time a file changes on GitHub, Vercel republishes the site by itself.

## Edit mode

Go to `yourdomain.com/#edit` to open the edit panel (text, sizes, positions, fruit list, pay link, order lookup).
Edits made there only save in your own browser. Use "copy changes" and send them to Claude to make them permanent.

## Coming next

The order email (a Stripe webhook plus a plate image) gets added in an `api/` folder in this same repo.
