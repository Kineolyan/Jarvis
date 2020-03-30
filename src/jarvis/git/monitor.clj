(ns jarvis.git.monitor
  (:require [jarvis.config :as config]))

(defn start
  [config-file]
  (config/register-config ::git config-file)
  (let [config (or (config/read-config ::git) {})
        aconfig (agent config)]
    (add-watch aconfig ::git config/write-config)
    {::config aconfig}))

(defn resolve-git-root
  [repository]
  ; TODO not done
  repository)

(defn remove-repository
  [config repository]
  (filter #(= repository (:repository %)) config))

(defn add-repository
  [config entry]
  (-> (remove-repository config)
      (conj entry)))

(defn attach
  "Records that the repository shall be up-to-date for this branch."
  [store repository branch]
  (let [git-root (resolve-git-root repository)]
    (send (::config store) add-repository {:repository repository
                                          :branch branch
                                          :git git-root})))

(defn detach
  [store repository]
  (send (::config store) dissoc ))