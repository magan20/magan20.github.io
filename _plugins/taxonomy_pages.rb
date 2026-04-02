module SigMagen
  module Publishing
    VALID_STATUS = %w[draft published].freeze
    VALID_ORIGINS = %w[manual notion editor].freeze

    module_function

    def all_docs(site)
      site.posts.docs + site.collections.fetch("research").docs
    end

    def published?(doc)
      doc.data.fetch("status", "draft") == "published"
    end

    def doc_type(doc)
      doc.collection.label == "research" ? "research" : "post"
    end

    def slugify(value)
      Jekyll::Utils.slugify(value.to_s, mode: "pretty")
    end

    def normalize_list(value)
      Array(value)
        .flatten
        .compact
        .map(&:to_s)
        .map(&:strip)
        .reject(&:empty?)
        .map { |item| slugify(item) }
        .uniq
    end

    def slug_for_doc(doc)
      return doc.data["slug"] if doc.data["slug"].to_s.strip != ""

      fallback =
        if doc.data["title"].to_s.strip != ""
          doc.data["title"]
        else
          doc.basename_without_ext.sub(/^\d{4}-\d{2}-\d{2}-/, "")
        end

      doc.data["slug"] = slugify(fallback)
    end

    def human_label(slug)
      slug.to_s.split("-").map(&:capitalize).join(" ")
    end
  end

  class TaxonomyPage < Jekyll::PageWithoutAFile
    def initialize(site:, dir:, taxonomy_type:, slug:, meta:, docs:)
      super(site, site.source, dir, "index.html")
      @data["layout"] = "taxonomy"
      @data["title"] = meta["label"] || Publishing.human_label(slug)
      @data["description"] = meta["description"] || "#{@data['title']} items."
      @data["taxonomy_type"] = taxonomy_type
      @data["taxonomy_slug"] = slug
      @data["taxonomy_meta"] = meta
      @data["items"] = docs.sort_by { |doc| doc.date || Time.at(0) }.reverse
      @data["permalink"] = "/#{taxonomy_type == 'category' ? 'categories' : 'tags'}/#{slug}/"
    end
  end

  class TaxonomyGenerator < Jekyll::Generator
    safe true
    priority :low

    def generate(site)
      category_defs = site.data.dig("taxonomy", "categories") || {}
      tag_defs = site.data.dig("taxonomy", "tags") || {}
      category_map = Hash.new { |hash, key| hash[key] = [] }
      tag_map = Hash.new { |hash, key| hash[key] = [] }

      Publishing.all_docs(site).each do |doc|
        normalize_and_validate(doc)
        next unless Publishing.published?(doc)

        doc.data["doc_type"] = Publishing.doc_type(doc)

        Publishing.normalize_list(doc.data["categories"]).each do |slug|
          category_map[slug] << doc
        end

        Publishing.normalize_list(doc.data["tags"]).each do |slug|
          tag_map[slug] << doc
        end
      end

      generated_taxonomy = { "categories" => {}, "tags" => {} }

      (category_defs.keys + category_map.keys).uniq.sort.each do |slug|
        meta = (category_defs[slug] || {}).dup
        meta["label"] ||= Publishing.human_label(slug)
        meta["count"] = category_map[slug].size
        meta["url"] = "/categories/#{slug}/"
        generated_taxonomy["categories"][slug] = meta

        site.pages << TaxonomyPage.new(
          site: site,
          dir: File.join("categories", slug),
          taxonomy_type: "category",
          slug: slug,
          meta: meta,
          docs: category_map[slug]
        )
      end

      (tag_defs.keys + tag_map.keys).uniq.sort.each do |slug|
        meta = (tag_defs[slug] || {}).dup
        meta["label"] ||= Publishing.human_label(slug)
        meta["count"] = tag_map[slug].size
        meta["url"] = "/tags/#{slug}/"
        generated_taxonomy["tags"][slug] = meta

        site.pages << TaxonomyPage.new(
          site: site,
          dir: File.join("tags", slug),
          taxonomy_type: "tag",
          slug: slug,
          meta: meta,
          docs: tag_map[slug]
        )
      end

      site.data["generated_taxonomy"] = generated_taxonomy
    end

    private

    def normalize_and_validate(doc)
      rel_path = doc.relative_path
      status = doc.data["status"].to_s.strip
      origin = doc.data["origin"].to_s.strip

      if status.empty?
        Jekyll.logger.warn("content-schema:", "#{rel_path} is missing 'status'; defaulting to draft.")
        doc.data["status"] = "draft"
      elsif !Publishing::VALID_STATUS.include?(status)
        Jekyll.logger.warn("content-schema:", "#{rel_path} has invalid status '#{status}'; forcing draft.")
        doc.data["status"] = "draft"
      end

      if origin.empty?
        Jekyll.logger.warn("content-schema:", "#{rel_path} is missing 'origin'; defaulting to manual.")
        doc.data["origin"] = "manual"
      elsif !Publishing::VALID_ORIGINS.include?(origin)
        Jekyll.logger.warn("content-schema:", "#{rel_path} has invalid origin '#{origin}'; forcing manual.")
        doc.data["origin"] = "manual"
      end

      categories = Publishing.normalize_list(doc.data["categories"])
      tags = Publishing.normalize_list(doc.data["tags"])

      if categories.empty?
        Jekyll.logger.warn("content-schema:", "#{rel_path} has no categories; falling back to 'engineering'.")
        categories = ["engineering"]
      end

      if tags.empty?
        Jekyll.logger.warn("content-schema:", "#{rel_path} has no tags; tag links will be omitted.")
      end

      doc.data["categories"] = categories
      doc.data["tags"] = tags
      doc.data["slug"] = Publishing.slug_for_doc(doc)
      doc.data["doc_type"] = Publishing.doc_type(doc)
    end
  end
end
