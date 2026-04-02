source "https://rubygems.org"

gem "jekyll", "~> 4.3.3"
gem "webrick", "~> 1.8"

if Gem::Version.new(RUBY_VERSION) >= Gem::Version.new("3.1")
  gem "jekyll-sass-converter", "~> 3.0"
else
  gem "ffi", "~> 1.15.5"
  gem "jekyll-sass-converter", "~> 2.2"
end

group :jekyll_plugins do
  gem "jekyll-seo-tag", "~> 2.8"
  gem "jekyll-sitemap", "~> 1.4"
end
