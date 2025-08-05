hostname = app-api.smzdm.com, h5.smzdm.com, haojia-api.smzdm.com, haojia.m.smzdm.com, user-api.smzdm.com, article-api.smzdm.com, s-api.smzdm.com, homepage-api.smzdm.com, haojia-cdn.smzdm.com

// rules
host, adx-api.zdmimg.com, reject

// 屏蔽
^https:\/\/app-api\.smzdm\.com\/util\/loading\? url reject-dict

^https:\/\/app-api\.smzdm\.com\/mychannel\/list$ url reject-dict

^https:\/\/article-api\.smzdm\.com\/publish\/get_bubble\? url reject-dict

^https:\/\/s-api\.smzdm\.com\/sou\/search_default_keyword\? url reject-dict

^https:\/\/user-api\.smzdm\.com\/vip\/bottom_card_list\? url reject-dict

^https:\/\/h5\.smzdm\.com\/user\/coupon\/coupon_list\? url reject-200

// jq重写
^https:\/\/homepage-api\.smzdm\.com\/v3\/home\? url jsonjq-response-body '.data.component |= map(if (.zz_content | type) == "array" then .zz_content |= map(select((.ad_campaign_id?|type=="string" and length>0) or (.tag?|type=="string" and length>0) or (.model_type?=="ads" and (type=="string")) | not)) else . end) | .data.component |= map(select(if has("zz_type") then (.zz_type | IN(["circular_banner","filter","list"][])) else true end)) | del(.data.theme) | .data.component |= map(if .zz_content|type=="object" then .zz_content |= del(.circular_banner_option) else . end)'

^https:\/\/app-api\.smzdm\.com\/util\/update$ url jsonjq-response-body '(.data.silence_local_push = 0) | (.data.baichuan_redirect_switch = 0)'

^https:\/\/app-api\.smzdm\.com\/util\/update$ url jsonjq-response-body 'del(.data.silence_local_push_msg, .data.video_cache_num_configs, .data.haojia_widget, .data.widget, .data.operation_float)'

^https:\/\/app-api\.smzdm\.com\/util\/update$ url jsonjq-response-body 'def r: if type=="object" then if has("ad_campaign_name") and (.ad_campaign_name|type=="string") and (.ad_campaign_name|test("\\S")) then empty else . end elif type=="array" then map(r) else . end; .data.operation_float |= map(map(r))'

^https:\/\/haojia-api\.smzdm\.com\/home\/list\? url jsonjq-response-body 'del(.data.header_operation.theme)'

^https:\/\/haojia-api\.smzdm\.com\/home\/list\? url jsonjq-response-body '.data.rows |= map(select(.cell_type == "39001")) | .data.banner_v2 |= map(select(.cell_type == "21028"))'

^https:\/\/haojia\.m\.smzdm\.com\/detail_modul\/user_related_modul\? url jsonjq-response-body 'del(.data.super_coupon)'

^https:\/\/haojia\.m\.smzdm\.com\/detail_modul\/other_modul\? url jsonjq-response-body 'del(.data.banner)'

^https:\/\/user-api\.smzdm\.com\/vip$ url jsonjq-response-body 'del(.data.activity_entrance_info, .data.big_banner, .data.top_banner, .data.banner_switch)'

^https:\/\/s-api\.smzdm\.com\/sou\/list_v10\? url jsonjq-response-body '.data.rows |= map(select(.model_type != "ads")) | .data.top_aladdin |= map(select(has("ad") | not))'

^https:\/\/s-api\.smzdm\.com\/sou\/filter\/tags\/hot_tags\? url jsonjq-response-body 'del(.data.search_faxian, .data.tonglan, .data.hongbao)'

^https:\/\/s-api\.smzdm\.com\/sou\/filter\/tags\/hot_tags\? url jsonjq-response-body '.data.search_hot.home |= map(select(.article_tag.article_title != "广告"))'

^https:\/\/haojia-api\.smzdm\.com\/detail\/\d+\? url jsonjq-response-body 'del(.data.quan_log)'

^https:\/\/haojia-cdn\.smzdm\.com\/preload\/\d+\/fiphone\/v\d+_\d+_\d+\/wx\d+\/im\d+\/[a-z0-9]+\/h5(?:c[0-9a-f]+)?\.json$ url jsonjq-response-body 'del(.data.quan_log)'
